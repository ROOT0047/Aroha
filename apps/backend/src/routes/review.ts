import { Hono } from "hono";
import { streamText } from "ai";
import { reviewInputSchema, type Mission, type PlanBlock } from "@aroha/shared";
import { requireAuth, type AuthContextVariables } from "../middleware/auth";
import { getAiApiKey, createAiProvider } from "../services/ai";

const ATTRS = ["Discipline", "Focus", "Knowledge", "Fitness", "Mental Clarity", "Consistency", "Productivity"];
const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

function shift(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function extractJson(text: string): { summary?: unknown; missions?: unknown; plan?: unknown; insights?: unknown } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AROHA AI returned an unreadable plan. Try again.");
  return JSON.parse(text.slice(start, end + 1));
}

export const reviewRouter = new Hono<{ Variables: AuthContextVariables }>();

reviewRouter.use("*", requireAuth);

reviewRouter.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parseResult = reviewInputSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues[0]?.message || "Invalid input" }, 400);
  }

  const { kind, date, now } = parseResult.data;
  const userId = c.get("userId");
  const supabase = c.get("supabase");
  const weekAgo = shift(date, -7);

  try {
    const [blocks, habits, logs, goals, health, focus, journal, prev] = await Promise.all([
      supabase.from("time_blocks").select("title, block_date, start_time, end_time, completed").gte("block_date", weekAgo).lte("block_date", date),
      supabase.from("habits").select("id, title").eq("archived", false),
      supabase.from("habit_logs").select("habit_id, log_date").gte("log_date", weekAgo).lte("log_date", date),
      supabase.from("goals").select("title, why, attribute, progress, target_date").eq("completed", false).limit(8),
      supabase.from("daily_logs").select("log_date, water_ml, sleep_hours, mood, energy").gte("log_date", weekAgo).lte("log_date", date),
      supabase.from("focus_sessions").select("session_date, duration_min").gte("session_date", weekAgo).lte("session_date", date),
      supabase.from("journal_entries").select("entry_date, mood, content").eq("entry_date", date).limit(2),
      supabase
        .from("daily_reviews")
        .select("review_date, kind, summary, missions, insights")
        .in("review_date", [date, shift(date, -1)])
        .order("review_date", { ascending: false }),
    ]);

    const blockRows = (blocks.data ?? []) as any[];
    const habitRows = (habits.data ?? []) as any[];
    const logRows = (logs.data ?? []) as any[];
    const past = blockRows.filter((b) => b.block_date < date);
    const today = blockRows.filter((b) => b.block_date === date);

    const plannedCount = past.length;
    const doneCount = past.filter((b) => b.completed).length;
    const blockAdherence = plannedCount ? Math.round((doneCount / plannedCount) * 100) : null;
    const habitLogCount = logRows.length;
    const possibleHabits = habitRows.length * 7;
    const habitAdherence = possibleHabits ? Math.round((habitLogCount / possibleHabits) * 100) : null;

    const facts = JSON.stringify({
      target_date: date,
      current_time: now,
      seven_day_metrics: {
        time_block_adherence_pct: blockAdherence,
        time_blocks_completed_vs_planned: `${doneCount}/${plannedCount}`,
        habit_consistency_pct: habitAdherence,
        focus_sessions_total: (focus.data ?? []).length,
        sleep_hours_recent: (health.data ?? []).map((h: any) => ({ date: h.log_date, sleep: h.sleep_hours })),
      },
      today_plan_so_far: today.map((b) => ({ title: b.title, span: `${b.start_time}-${b.end_time}`, done: b.completed })),
      active_goals: (goals.data ?? []).map((g: any) => ({ title: g.title, progress_pct: g.progress, attribute: g.attribute })),
      active_habits: habitRows.map((h: any) => h.title),
      journal_today: (journal.data ?? []).map((j: any) => j.content),
      previous_reviews: (prev.data ?? []).slice(0, 2),
    });

    const task =
      kind === "morning"
        ? `Write the MORNING COMMAND. Return only JSON:
{"summary": string (max 80 words, realistic tactical preview for today),
 "missions": [{"title": string (max 60 chars, clear action), "attribute": one of ${JSON.stringify(ATTRS)}}] (3-5 items),
 "plan": [{"title": string, "start": "HH:MM", "end": "HH:MM", "priority": "high"|"medium"|"low"}] (3-6 blocks starting at or after ${now}),
 "insights": [3 short items: one win from yesterday, one focus for today, one risk to mitigate]}`
        : `Write the EVENING REVIEW. Return only JSON:
{"summary": string (max 80 words, honest analysis of today versus missions and plan),
 "missions": [],
 "plan": [],
 "insights": [3 short items: one win, one gap, one specific adjustment for tomorrow]}`;

    const apiKey = getAiApiKey();
    const provider = createAiProvider(apiKey);
    const result = streamText({
      model: provider("gemini-2.5-flash"),
      system:
        "You are AROHA AI, an adaptive planner modelled on a calm, analytical strategist. No emoji, no flattery. Output valid json only.",
      prompt: `${task}\n\nUser data (json context):\n${facts}`,
    });

    let text = "";
    try {
      text = await result.text;
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error);
      if (/402|credit/i.test(msg)) {
        return c.json({ error: "AI credits are used up. Add credits to keep using AROHA AI." }, 402);
      }
      if (/429|rate/i.test(msg)) {
        return c.json({ error: "AROHA AI is busy. Please try again in a minute." }, 429);
      }
      return c.json({ error: "AROHA AI could not build your review. Please try again." }, 500);
    }

    const parsed = extractJson(text);

    const missions: Mission[] = (Array.isArray(parsed.missions) ? parsed.missions : [])
      .slice(0, 5)
      .map((m: { title?: unknown; attribute?: unknown }, i: number) => ({
        id: `m${i}-${Date.now().toString(36)}`,
        title: String(m.title ?? "").slice(0, 80),
        attribute: ATTRS.includes(String(m.attribute)) ? String(m.attribute) : "Discipline",
        done: false,
      }))
      .filter((m: Mission) => m.title);

    const plan: PlanBlock[] = (Array.isArray(parsed.plan) ? parsed.plan : [])
      .slice(0, 6)
      .map((b: { title?: unknown; start?: unknown; end?: unknown; priority?: unknown }) => ({
        title: String(b.title ?? "").slice(0, 80),
        start: String(b.start ?? ""),
        end: String(b.end ?? ""),
        priority: ["high", "medium", "low"].includes(String(b.priority)) ? String(b.priority) : "medium",
      }))
      .filter((b: PlanBlock) => b.title && timeRe.test(b.start) && timeRe.test(b.end) && b.start < b.end);

    const insights = (Array.isArray(parsed.insights) ? parsed.insights : []).slice(0, 4).map((s: unknown) => String(s).slice(0, 200));
    const summary = String(parsed.summary ?? "").slice(0, 800);

    const { data: saved, error } = await supabase
      .from("daily_reviews")
      .upsert(
        { user_id: userId, review_date: date, kind, summary, missions, plan, insights, updated_at: new Date().toISOString() },
        { onConflict: "user_id,review_date,kind" },
      )
      .select()
      .single();

    if (error) {
      console.error("[review] Database save error:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("[review] Unhandled error:", error);
    return c.json({ error: error.message || "Failed to generate review" }, 500);
  }
});
