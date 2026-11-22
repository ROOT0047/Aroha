import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { isScheduleDate } from "./schedule-dates";

export type Mission = { id: string; title: string; attribute: string; done: boolean };
export type PlanBlock = { title: string; start: string; end: string; priority: string };

const ATTRS = ["Discipline", "Focus", "Knowledge", "Fitness", "Mental Clarity", "Consistency", "Productivity"];

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

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

export const generateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        kind: z.enum(["morning", "evening"]),
        date: z.string().refine(isScheduleDate, "Pick a valid date"),
        now: z.string().regex(timeRe),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { kind, date, now } = data;
    const weekAgo = shift(date, -7);

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

    const blockRows = blocks.data ?? [];
    const habitRows = habits.data ?? [];
    const logRows = logs.data ?? [];
    const past = blockRows.filter((b) => b.block_date < date);
    const today = blockRows.filter((b) => b.block_date === date);
    const pastRate = past.length ? Math.round((past.filter((b) => b.completed).length / past.length) * 100) : null;
    const habitMisses = habitRows
      .map((h) => ({ title: h.title, hits: logRows.filter((l) => l.habit_id === h.id && l.log_date < date).length }))
      .filter((h) => h.hits < 4)
      .map((h) => `${h.title} (${h.hits}/7)`);
    const habitsToday = logRows.filter((l) => l.log_date === date).length;
    const focusToday = (focus.data ?? []).filter((f) => f.session_date === date).reduce((s, f) => s + f.duration_min, 0);
    const focusWeek = (focus.data ?? []).reduce((s, f) => s + f.duration_min, 0);
    const healthToday = (health.data ?? []).find((h) => h.log_date === date);
    const prevRows = prev.data ?? [];
    const lastEvening = prevRows.find((r) => r.kind === "evening" && r.review_date === shift(date, -1));
    const morning = prevRows.find((r) => r.kind === "morning" && r.review_date === date);

    const facts = [
      `Date ${date}, local time ${now}.`,
      `Active goals: ${(goals.data ?? []).map((g) => `${g.title} [${g.attribute}, ${g.progress}%${g.target_date ? `, due ${g.target_date}` : ""}]`).join("; ") || "none"}.`,
      `Last 7 days block completion: ${pastRate === null ? "no data" : `${pastRate}% of ${past.length}`}.`,
      `Weak habits this week: ${habitMisses.join(", ") || "none"}.`,
      `Habits checked today: ${habitsToday}/${habitRows.length}.`,
      `Today's blocks: ${today.map((b) => `${b.start_time.slice(0, 5)}-${b.end_time.slice(0, 5)} ${b.title}${b.completed ? " (done)" : ""}`).join("; ") || "none planned"}.`,
      `Focus today ${focusToday} min, week ${focusWeek} min.`,
      `Health today: water ${healthToday?.water_ml ?? 0} ml, sleep ${healthToday?.sleep_hours ?? "unlogged"} h, mood ${healthToday?.mood ?? "unlogged"}.`,
      lastEvening ? `Yesterday's review adjustments: ${JSON.stringify(lastEvening.insights)}.` : "",
      kind === "evening" && morning
        ? `This morning's missions: ${(morning.missions as Mission[]).map((m) => `${m.title}${m.done ? " (done)" : " (missed)"}`).join("; ")}.`
        : "",
      kind === "evening" ? `Journal today: ${(journal.data ?? []).map((j) => j.content.slice(0, 300)).join(" | ") || "none"}.` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const task =
      kind === "morning"
        ? `Write the MORNING BRIEFING. Return only JSON:
{"summary": string (max 70 words, calm strategist tone, reference real data),
 "missions": [3 to 5 items {"title": string (concrete, finishable today, max 60 chars), "attribute": one of ${ATTRS.join("|")}}],
 "plan": [2 to 6 adaptive time blocks {"title": string, "start": "HH:MM", "end": "HH:MM", "priority": "high"|"medium"|"low"}],
 "insights": [2 or 3 short adaptation notes, e.g. why the plan changed versus last week]}
Plan rules: blocks start after ${now}, must not overlap existing blocks, fit weak habits and goals, shorten blocks if completion rate is under 60%.`
        : `Write the EVENING REVIEW. Return only JSON:
{"summary": string (max 80 words, honest analysis of today versus missions and plan),
 "missions": [],
 "plan": [],
 "insights": [3 short items: one win, one gap, one specific adjustment for tomorrow]}`;

    for (const result of [blocks, habits, logs, goals, health, focus, journal, prev]) {
      if (result.error) throw new Error("Could not load your daily data. Please try again.");
    }
    const { arohaText } = await import("./aroha-ai.server");
    const text = await arohaText(
      "You are AROHA AI, an adaptive planner modelled on a calm, analytical strategist. No emoji, no flattery. Output valid JSON only.",
      `${task}\n\nUser data (JSON context):\n${facts}`,
      true,
    );
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
      .filter((b: PlanBlock) => b.title && timeRe.test(b.start) && timeRe.test(b.end) && b.start < b.end && b.start > now)
      .sort((a, b) => a.start.localeCompare(b.start));
    const occupied = today.map((b) => ({ start: b.start_time.slice(0, 5), end: b.end_time.slice(0, 5) }));
    const safePlan = plan.filter((b) => {
      if (occupied.some((slot) => b.start < slot.end && b.end > slot.start)) return false;
      occupied.push(b);
      return true;
    });
    const insights = (Array.isArray(parsed.insights) ? parsed.insights : []).slice(0, 4).map((s: unknown) => String(s).slice(0, 200));
    const summary = String(parsed.summary ?? "").slice(0, 800);

    const { data: saved, error } = await supabase
      .from("daily_reviews")
      .upsert(
        { user_id: userId, review_date: date, kind, summary, missions, plan: safePlan, insights, updated_at: new Date().toISOString() },
        { onConflict: "user_id,review_date,kind" },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return saved;
  });
