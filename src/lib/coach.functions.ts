import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SYSTEM = `You are AROHA AI, a discipline coach modelled on a calm, analytical strategist.
Rules: be direct, concise (max 90 words), never flattering, never use emoji.
Reference the user's real data when it is provided. Give one concrete next action.`;

export const askCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ message: z.string().trim().min(1).max(1000), date: z.string().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { isScheduleDate } = await import("./schedule-dates");
    const today = data.date && isScheduleDate(data.date) ? data.date : new Date().toISOString().slice(0, 10);
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
      `Habits tracked: ${habitList.length ? habitList.map((h) => h.title).join(", ") : "none yet"}.`,
      `Habits checked in today: ${(logs.data ?? []).length}/${habitList.length}.`,
      `Blocks today: ${blockList.length} planned, ${blockList.filter((b) => b.completed).length} completed${
        blockList.length ? ` (${blockList.map((b) => b.title).join(", ")})` : ""
      }.`,
    ].join(" ");

    for (const result of [history, habits, logs, blocks]) {
      if (result.error) throw new Error("Could not load your daily data. Please try again.");
    }
    const { arohaText } = await import("./aroha-ai.server");
    const conversation = (history.data ?? []).slice().reverse().map((message) =>
      `${message.role === "user" ? "User" : "Coach"}: ${message.content}`,
    ).join("\n");
    const reply = await arohaText(`${SYSTEM}\n\nUser data: ${contextLine}`, `${conversation}\nUser: ${data.message}`);
    const { error } = await supabase.from("coach_messages").insert([
      { user_id: userId, role: "user", content: data.message },
      { user_id: userId, role: "coach", content: reply },
    ]);
    if (error) throw new Error("Your answer could not be saved. Please try again.");

    return { reply };
  });
