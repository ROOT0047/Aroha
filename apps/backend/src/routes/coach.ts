import { Hono } from "hono";
import { streamText } from "ai";
import { coachInputSchema } from "@aroha/shared";
import { requireAuth, type AuthContextVariables } from "../middleware/auth";
import { getAiApiKey, createAiProvider } from "../services/ai";

const SYSTEM = `You are AROHA AI, a discipline coach modelled on a calm, analytical strategist.
Rules: be direct, concise (max 90 words), never flattering, never use emoji.
Reference the user's real data when it is provided. Give one concrete next action.`;

export const coachRouter = new Hono<{ Variables: AuthContextVariables }>();

coachRouter.use("*", requireAuth);

coachRouter.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parseResult = coachInputSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues[0]?.message || "Invalid input" }, 400);
  }

  const { message } = parseResult.data;
  const userId = c.get("userId");
  const supabase = c.get("supabase");

  try {
    // 1. Record user message
    await supabase
      .from("coach_messages")
      .insert({ user_id: userId, role: "user", content: message });

    // 2. Fetch user context
    const today = new Date().toISOString().slice(0, 10);
    const [history, habits, logs, blocks] = await Promise.all([
      supabase
        .from("coach_messages")
        .select("role, content")
        .order("created_at", { ascending: false })
        .limit(16),
      supabase.from("habits").select("title, cadence").eq("archived", false),
      supabase.from("habit_logs").select("habit_id").eq("log_date", today),
      supabase.from("time_blocks").select("title, completed").eq("block_date", today),
    ]);

    const habitList = habits.data ?? [];
    const blockList = blocks.data ?? [];
    const contextLine = [
      `Date: ${today}.`,
      `Habits tracked: ${habitList.length ? habitList.map((h: any) => h.title).join(", ") : "none yet"}.`,
      `Habits checked in today: ${(logs.data ?? []).length}/${habitList.length}.`,
      `Blocks today: ${blockList.length} planned, ${blockList.filter((b: any) => b.completed).length} completed${
        blockList.length ? ` (${blockList.map((b: any) => b.title).join(", ")})` : ""
      }.`,
    ].join(" ");

    // 3. Setup AI provider
    const apiKey = getAiApiKey();
    const provider = createAiProvider(apiKey);
    const priorMessages = (history.data ?? [])
      .slice()
      .reverse()
      .map((m: any) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }));

    let streamError: unknown = null;
    const result = streamText({
      model: provider("gemini-2.5-flash"),
      system: `${SYSTEM}\n\nUser data: ${contextLine}`,
      messages: priorMessages,
      onError: ({ error }) => {
        streamError = error;
        console.error("[coach] AI stream error:", error);
      },
    });

    let reply = "";
    try {
      reply = (await result.text).trim();
    } catch (error) {
      console.error("[coach] Generation failed:", error);
      return c.json({ error: "AROHA AI couldn't reply. Try again in a moment." }, 500);
    }

    if (!reply) {
      return c.json({ error: "AROHA AI returned an empty response." }, 500);
    }

    // 4. Save coach message
    await supabase
      .from("coach_messages")
      .insert({ user_id: userId, role: "coach", content: reply });

    return c.json({ success: true, reply });
  } catch (error: any) {
    console.error("[coach] Unhandled error:", error);
    return c.json({ error: error.message || "Failed to process coach request" }, 500);
  }
});
