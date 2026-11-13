import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { totalXp, type XpInput } from "@/lib/xp";

const notifyError = (e: unknown) =>
  toast.error(e instanceof Error ? e.message : "Something went wrong — please try again");
import {
  healthStats,
  
  type Achievement,
  type CoachMessage,
  type Habit,
  type JournalEntry,
  type ScheduleBlock,
} from "@/data/mock";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const DAY = 86_400_000;

export function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

const todayISO = () => isoDate(new Date());

function shiftISO(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return isoDate(new Date(y!, m! - 1, d! + days));
}

const hhmm = (t: string) => t.slice(0, 5);

function durationLabel(start: string, end: string) {
  const [sh, sm] = hhmm(start).split(":").map(Number);
  const [eh, em] = hhmm(end).split(":").map(Number);
  let mins = eh! * 60 + em! - (sh! * 60 + sm!);
  if (mins <= 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m} min`;
}

type BlockRow = {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  priority: string;
  color: string;
  completed: boolean;
};

function toBlock(r: BlockRow): ScheduleBlock {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    startTime: hhmm(r.start_time),
    endTime: hhmm(r.end_time),
    durationLabel: durationLabel(r.start_time, r.end_time),
    priority: (r.priority as ScheduleBlock["priority"]) ?? "Medium",
    completed: r.completed,
    color: (r.color as ScheduleBlock["color"]) ?? "primary",
  };
}

export type TrendPoint = { label: string; score: number; tasks: number };
export type WeekDayPlan = {
  iso: string;
  day: string;
  date: number;
  total: number;
  done: number;
};

export type Progression = {
  xp: number;
  level: number;
  rank: string;
  nextRank: string | null;
  levelXp: number;
  levelSpan: number;
  progress: number;
  xpToNext: number;
};

const RANKS = [
  { level: 1, name: "Novice" },
  { level: 4, name: "Disciplined" },
  { level: 8, name: "Focused" },
  { level: 12, name: "Relentless" },
  { level: 18, name: "Elite" },
  { level: 25, name: "Sovereign" },
] as const;

/** Cumulative XP required to reach a given level (level 1 = 0). */
function xpForLevel(level: number) {
  return 50 * (level - 1) * level;
}

function rankForLevel(level: number) {
  let current: string = RANKS[0]!.name;
  let next: string | null = null;
  for (const r of RANKS) {
    if (level >= r.level) current = r.name;
    else {
      next = r.name;
      break;
    }
  }
  return { rank: current, nextRank: next };
}

export function computeProgression(input: XpInput): Progression {
  const xp = totalXp(input);
  let level = 1;
  while (xpForLevel(level + 1) <= xp && level < 99) level++;
  const base = xpForLevel(level);
  const nextAt = xpForLevel(level + 1);
  const levelXp = xp - base;
  const levelSpan = nextAt - base;
  return {
    xp,
    level,
    ...rankForLevel(level),
    levelXp,
    levelSpan,
    progress: Math.round((levelXp / levelSpan) * 100),
    xpToNext: Math.max(0, nextAt - xp),
  };
}


export function startOfWeekISO(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return isoDate(d);
}

/* ------------------------------------------------------------------ */
/* context                                                             */
/* ------------------------------------------------------------------ */

type ArohaState = {
  loading: boolean;
  selectedDate: string;
  setSelectedDate: (iso: string) => void;
  schedule: ScheduleBlock[];
  habits: Habit[];
  journal: JournalEntry[];
  achievements: Achievement[];
  progression: Progression;
  coach: CoachMessage[];
  focusMinutes: number;
  sessions: number;
  water: number;
  sleep: number;
  disciplineScore: number;
  weekTrend: TrendPoint[];
  monthTrend: TrendPoint[];
  heatmap: number[];
  toggleBlock: (id: string) => void;
  addBlock: (
    block: Omit<ScheduleBlock, "id" | "completed" | "durationLabel">,
    options?: { weekdays?: number[]; weeks?: number; date?: string; days?: number },
  ) => void;
  updateBlock: (
    id: string,
    patch: Partial<
      Pick<ScheduleBlock, "title" | "description" | "startTime" | "endTime" | "priority" | "color">
    > & { date?: string },
  ) => void;
  deleteBlock: (id: string) => void;
  deleteBlocks: (ids: string[]) => void;
  weekPlan: WeekDayPlan[];
  toggleHabit: (id: string) => void;
  addHabit: (habit: Pick<Habit, "title" | "cadence" | "goal" | "unit">) => void;
  deleteHabit: (id: string) => void;
  addJournal: (entry: Pick<JournalEntry, "title" | "mood" | "content">) => void;
  addCoachMessage: (message: CoachMessage) => void;
  refreshCoach: () => Promise<void>;
  logFocus: (minutes: number) => void;
  addWater: (ml: number) => void;
  setSleep: (hours: number) => void;
  focusSessionsToday: number;
  journaledToday: boolean;
  goalsCount: number;
};

const ArohaContext = createContext<ArohaState | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

export function ArohaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<string>(todayISO());

  const rangeStart = useMemo(() => isoDate(new Date(Date.now() - 90 * DAY)), []);
  const enabled = !!userId;
  const todayKey = todayISO();

  const dailyLogsQuery = useQuery({
    queryKey: ["daily-logs", userId, rangeStart],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("log_date, water_ml, sleep_hours")
        .gte("log_date", rangeStart);
      if (error) throw error;
      return data ?? [];
    },
  });

  const focusQuery = useQuery({
    queryKey: ["focus-sessions", userId, rangeStart],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("focus_sessions")
        .select("session_date, duration_min, completed")
        .gte("session_date", rangeStart);
      if (error) throw error;
      return data ?? [];
    },
  });

  const goalsQuery = useQuery({
    queryKey: ["goals", userId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const todayLog = (dailyLogsQuery.data ?? []).find((l) => l.log_date === todayKey);
  const water = todayLog?.water_ml ?? 0;
  const sleep = Number(todayLog?.sleep_hours ?? 0);
  const todaySessions = (focusQuery.data ?? []).filter((s) => s.session_date === todayKey && s.completed);
  const focusMinutes = todaySessions.reduce((a, s) => a + s.duration_min, 0);
  const sessions = todaySessions.length;
  void healthStats;

  const blocksQuery = useQuery({
    queryKey: ["blocks", userId, selectedDate],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_blocks")
        .select("id, title, description, start_time, end_time, priority, color, completed")
        .eq("block_date", selectedDate)
        .order("start_time");
      if (error) throw error;
      return (data ?? []).map((r) => toBlock(r as BlockRow));
    },
  });

  const blockHistoryQuery = useQuery({
    queryKey: ["blocks-history", userId, rangeStart],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_blocks")
        .select("block_date, completed")
        .gte("block_date", rangeStart);
      if (error) throw error;
      return data ?? [];
    },
  });

  const habitsQuery = useQuery({
    queryKey: ["habits", userId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("id, title, icon, cadence, goal, unit")
        .eq("archived", false)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const logsQuery = useQuery({
    queryKey: ["habit-logs", userId, rangeStart],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habit_logs")
        .select("habit_id, log_date")
        .gte("log_date", rangeStart);
      if (error) throw error;
      return data ?? [];
    },
  });

  const journalQuery = useQuery({
    queryKey: ["journal", userId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("id, title, mood, content, entry_date")
        .order("entry_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        mood: e.mood as JournalEntry["mood"],
        content: e.content,
        entryDate: e.entry_date,
        createdAt: new Date(`${e.entry_date}T00:00:00`).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      })) satisfies JournalEntry[];
    },
  });

  const coachQuery = useQuery({

    queryKey: ["coach", userId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_messages")
        .select("id, role, content")
        .order("created_at")
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((m) => ({
        id: m.id,
        role: m.role === "user" ? "user" : "coach",
        content: m.content,
      })) as CoachMessage[];
    },
  });

  /* ----------------------------- derived --------------------------- */

  const today = todayISO();
  const logRows = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);
  const habitRows = useMemo(() => habitsQuery.data ?? [], [habitsQuery.data]);

  const logsByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const l of logRows) {
      const set = map.get(l.habit_id) ?? new Set<string>();
      set.add(l.log_date);
      map.set(l.habit_id, set);
    }
    return map;
  }, [logRows]);

  const habits = useMemo<Habit[]>(() => {
    return habitRows.map((h) => {
      const done = logsByHabit.get(h.id) ?? new Set<string>();
      const history = Array.from({ length: 30 }, (_, i) =>
        done.has(shiftISO(today, i - 29)),
      );
      let streak = 0;
      const startOffset = done.has(today) ? 0 : 1;
      for (let i = startOffset; i < 400; i++) {
        if (done.has(shiftISO(today, -i))) streak++;
        else break;
      }
      let best = 0;
      let run = 0;
      for (let i = 90; i >= 0; i--) {
        if (done.has(shiftISO(today, -i))) {
          run++;
          best = Math.max(best, run);
        } else run = 0;
      }
      return {
        id: h.id,
        title: h.title,
        icon: h.icon,
        cadence: h.cadence as Habit["cadence"],
        goal: h.goal,
        unit: h.unit,
        streak,
        bestStreak: Math.max(best, streak),
        completedToday: done.has(today),
        history,
      };
    });
  }, [habitRows, logsByHabit, today]);

  const blockStats = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const b of blockHistoryQuery.data ?? []) {
      const entry = map.get(b.block_date) ?? { total: 0, done: 0 };
      entry.total++;
      if (b.completed) entry.done++;
      map.set(b.block_date, entry);
    }
    return map;
  }, [blockHistoryQuery.data]);

  const logsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of logRows) map.set(l.log_date, (map.get(l.log_date) ?? 0) + 1);
    return map;
  }, [logRows]);

  const dayScore = useCallback(
    (iso: string) => {
      const habitRate = habitRows.length
        ? Math.min(1, (logsByDate.get(iso) ?? 0) / habitRows.length)
        : 0;
      const blocks = blockStats.get(iso);
      const taskRate = blocks && blocks.total ? blocks.done / blocks.total : 0;
      const weight = habitRows.length && blocks?.total ? [0.6, 0.4] : habitRows.length ? [1, 0] : [0, 1];
      return Math.round(100 * (habitRate * weight[0]! + taskRate * weight[1]!));
    },
    [habitRows.length, logsByDate, blockStats],
  );

  const disciplineScore = useMemo(() => dayScore(today), [dayScore, today]);

  const weekTrend = useMemo<TrendPoint[]>(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const iso = shiftISO(today, i - 6);
        const [y, m, d] = iso.split("-").map(Number);
        return {
          label: new Date(y!, m! - 1, d!).toLocaleDateString(undefined, { weekday: "short" }),
          score: dayScore(iso),
          tasks: blockStats.get(iso)?.done ?? 0,
        };
      }),
    [today, dayScore, blockStats],
  );

  const monthTrend = useMemo<TrendPoint[]>(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const iso = shiftISO(today, i - 29);
        return {
          label: iso.slice(8),
          score: dayScore(iso),
          tasks: blockStats.get(iso)?.done ?? 0,
        };
      }),
    [today, dayScore, blockStats],
  );

  const heatmap = useMemo(
    () =>
      Array.from({ length: 91 }, (_, i) => logsByDate.get(shiftISO(today, i - 90)) ?? 0),
    [today, logsByDate],
  );

  const totalCheckins = logRows.length;
  const completedBlocks = useMemo(
    () => (blockHistoryQuery.data ?? []).filter((b) => b.completed).length,
    [blockHistoryQuery.data],
  );
  const bestStreak = habits.length ? Math.max(...habits.map((h) => h.bestStreak)) : 0;
  const perfectDay = useMemo(() => {
    if (!habitRows.length) return false;
    for (const [iso, count] of logsByDate) {
      const blocks = blockStats.get(iso);
      if (count >= habitRows.length && (!blocks || blocks.done === blocks.total)) return true;
    }
    return false;
  }, [habitRows.length, logsByDate, blockStats]);

  const achievements = useMemo<Achievement[]>(
    () => [
      { id: "a1", name: "First Step", detail: "Create your first habit", unlocked: habitRows.length > 0 },
      { id: "a2", name: "Planner", detail: "Complete 25 scheduled blocks", unlocked: completedBlocks >= 25 },
      { id: "a3", name: "Week of Steel", detail: "A 7-day streak on any habit", unlocked: bestStreak >= 7 },
      { id: "a4", name: "Perfect Day", detail: "Every habit and block done in one day", unlocked: perfectDay },
      { id: "a5", name: "Iron Month", detail: "A 30-day streak on any habit", unlocked: bestStreak >= 30 },
      { id: "a6", name: "Century", detail: "100 habit check-ins logged", unlocked: totalCheckins >= 100 },
    ],
    [habitRows.length, completedBlocks, bestStreak, perfectDay, totalCheckins],
  );

  const focusSessionCount = (focusQuery.data ?? []).filter((s) => s.completed).length;
  const journalDays = new Set((journalQuery.data ?? []).map((j) => j.entryDate)).size;
  const healthDays = (dailyLogsQuery.data ?? []).filter(
    (l) => l.water_ml > 0 || Number(l.sleep_hours) > 0,
  ).length;
  const goalsCompleted = (goalsQuery.data ?? []).filter((g) => g.completed).length;

  const progression = useMemo(
    () =>
      computeProgression({
        checkins: totalCheckins,
        completedBlocks,
        bestStreak,
        disciplineScore,
        badges: achievements.filter((a) => a.unlocked).length,
        focusSessions: focusSessionCount,
        journalDays,
        healthDays,
        goalsCompleted,
      }),
    [totalCheckins, completedBlocks, bestStreak, disciplineScore, achievements, focusSessionCount, journalDays, healthDays, goalsCompleted],
  );


  /* ---------------------------- mutations -------------------------- */

  const invalidateBlocks = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["blocks"] });
    void qc.invalidateQueries({ queryKey: ["blocks-history"] });
  }, [qc]);

  const invalidateHabits = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["habits"] });
    void qc.invalidateQueries({ queryKey: ["habit-logs"] });
  }, [qc]);

  const toggleBlockMutation = useMutation({
    mutationFn: async (id: string) => {
      const current = (blocksQuery.data ?? []).find((b) => b.id === id);
      const { error } = await supabase
        .from("time_blocks")
        .update({ completed: !current?.completed })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateBlocks,
    onError: notifyError,
  });

  const addBlockMutation = useMutation({
    mutationFn: async ({
      block,
      options,
    }: {
      block: Omit<ScheduleBlock, "id" | "completed" | "durationLabel">;
      options?: { weekdays?: number[]; weeks?: number; date?: string; days?: number };
    }) => {
      if (!userId) return;
      const baseDate =
        options?.date && /^\d{4}-\d{2}-\d{2}$/.test(options.date) ? options.date : selectedDate;
      const weekdays = options?.weekdays?.length ? options.weekdays : null;
      const weeks = Math.max(1, Math.min(8, options?.weeks ?? 1));
      const days = Math.max(1, Math.min(30, options?.days ?? 1));
      const dates: string[] = [];
      if (weekdays) {
        const base = startOfWeekISO(new Date(`${baseDate}T00:00:00`));
        for (let w = 0; w < weeks; w++) {
          for (const wd of weekdays) dates.push(shiftISO(base, w * 7 + wd));
        }
      } else {
        for (let i = 0; i < days; i++) dates.push(shiftISO(baseDate, i));
      }
      const today = todayISO();
      const rows = Array.from(new Set(dates))
        .filter((d) => d >= today || d === baseDate)
        .map((block_date) => ({
          user_id: userId,
          block_date,
          title: block.title,
          description: block.description,
          start_time: block.startTime,
          end_time: block.endTime,
          priority: block.priority,
          color: block.color,
        }));
      if (!rows.length) return;
      const { error } = await supabase.from("time_blocks").insert(rows);
      if (error) throw error;
    },
    onSuccess: invalidateBlocks,
    onError: notifyError,
  });

  const updateBlockMutation = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<
        Pick<ScheduleBlock, "title" | "description" | "startTime" | "endTime" | "priority" | "color">
      > & { date?: string };
    }) => {
      const row: Record<string, string> = {};
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.description !== undefined) row.description = patch.description;
      if (patch.startTime !== undefined) row.start_time = patch.startTime;
      if (patch.endTime !== undefined) row.end_time = patch.endTime;
      if (patch.priority !== undefined) row.priority = patch.priority;
      if (patch.color !== undefined) row.color = patch.color;
      if (patch.date && /^\d{4}-\d{2}-\d{2}$/.test(patch.date)) row.block_date = patch.date;
      if (!Object.keys(row).length) return;
      const { error } = await supabase.from("time_blocks").update(row).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateBlocks,
    onError: notifyError,
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("time_blocks").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: invalidateBlocks,
    onError: notifyError,
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) return;
      const done = logsByHabit.get(id)?.has(today);
      if (done) {
        const { error } = await supabase
          .from("habit_logs")
          .delete()
          .eq("habit_id", id)
          .eq("log_date", today);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("habit_logs")
          .insert({ user_id: userId, habit_id: id, log_date: today });
        if (error) throw error;
      }
    },
    onSuccess: invalidateHabits,
    onError: notifyError,
  });

  const addHabitMutation = useMutation({
    mutationFn: async (habit: Pick<Habit, "title" | "cadence" | "goal" | "unit">) => {
      if (!userId) return;
      const { error } = await supabase.from("habits").insert({
        user_id: userId,
        title: habit.title,
        cadence: habit.cadence,
        goal: habit.goal,
        unit: habit.unit,
      });
      if (error) throw error;
    },
    onSuccess: invalidateHabits,
    onError: notifyError,
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateHabits,
    onError: notifyError,
  });

  const addJournalMutation = useMutation({
    mutationFn: async (entry: Pick<JournalEntry, "title" | "mood" | "content">) => {
      if (!userId) return;
      const { error } = await supabase.from("journal_entries").insert({
        user_id: userId,
        title: entry.title,
        mood: entry.mood,
        content: entry.content,
        entry_date: todayISO(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["journal"] });
      toast.success("Reflection saved");
    },
    onError: notifyError,
  });

  const addJournal = useCallback(
    (entry: Pick<JournalEntry, "title" | "mood" | "content">) => {
      addJournalMutation.mutate(entry);
    },
    [addJournalMutation],
  );


  const addCoachMessage = useCallback(
    (message: CoachMessage) => {
      qc.setQueryData<CoachMessage[]>(["coach", userId], (prev) => [...(prev ?? []), message]);
    },
    [qc, userId],
  );

  const refreshCoach = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["coach", userId] });
  }, [qc, userId]);

  const focusMutation = useMutation({
    mutationFn: async (minutes: number) => {
      if (!userId) return;
      const m = Math.max(1, Math.min(600, Math.round(minutes)));
      const { error } = await supabase
        .from("focus_sessions")
        .insert({ user_id: userId, duration_min: m, session_date: todayISO(), completed: true });
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["focus-sessions"] }),
    onError: notifyError,
  });

  const healthMutation = useMutation({
    mutationFn: async (patch: { water_ml?: number; sleep_hours?: number }) => {
      if (!userId) return;
      const { error } = await supabase
        .from("daily_logs")
        .upsert(
          { user_id: userId, log_date: todayISO(), water_ml: water, sleep_hours: sleep, ...patch },
          { onConflict: "user_id,log_date" },
        );
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["daily-logs"] }),
    onError: notifyError,
  });

  const logFocus = useCallback((minutes: number) => focusMutation.mutate(minutes), [focusMutation]);
  const addWater = useCallback(
    (ml: number) => healthMutation.mutate({ water_ml: Math.max(0, Math.min(8000, water + ml)) }),
    [healthMutation, water],
  );
  const setSleep = useCallback(
    (hours: number) => {
      const h = Math.max(0, Math.min(16, Math.round(hours * 4) / 4));
      healthMutation.mutate({ sleep_hours: h }, { onSuccess: () => toast.success("Sleep saved") });
    },
    [healthMutation],
  );

  const weekPlan = useMemo<WeekDayPlan[]>(() => {
    const base = startOfWeekISO(new Date(`${selectedDate}T00:00:00`));
    return Array.from({ length: 7 }, (_, i) => {
      const iso = shiftISO(base, i);
      const [y, m, d] = iso.split("-").map(Number);
      const dt = new Date(y!, m! - 1, d!);
      const stats = blockStats.get(iso);
      return {
        iso,
        day: dt.toLocaleDateString(undefined, { weekday: "short" }),
        date: dt.getDate(),
        total: stats?.total ?? 0,
        done: stats?.done ?? 0,
      };
    });
  }, [selectedDate, blockStats]);

  const loading =
    enabled &&
    (blocksQuery.isLoading || habitsQuery.isLoading || logsQuery.isLoading);

  const value = useMemo<ArohaState>(
    () => ({
      loading,
      selectedDate,
      setSelectedDate,
      schedule: blocksQuery.data ?? [],
      weekPlan,
      habits,
      journal: journalQuery.data ?? [],

      achievements,
      progression,
      coach: coachQuery.data ?? [],
      focusMinutes,
      sessions,
      water,
      sleep,
      disciplineScore,
      weekTrend,
      monthTrend,
      heatmap,
      toggleBlock: (id) => toggleBlockMutation.mutate(id),
      addBlock: (b, options) =>
        addBlockMutation.mutate(options ? { block: b, options } : { block: b }),
      updateBlock: (id, patch) => updateBlockMutation.mutate({ id, patch }),
      deleteBlock: (id) => deleteBlockMutation.mutate([id]),
      deleteBlocks: (ids) => {
        if (ids.length) deleteBlockMutation.mutate(ids);
      },
      toggleHabit: (id) => toggleHabitMutation.mutate(id),
      addHabit: (h) => addHabitMutation.mutate(h),
      deleteHabit: (id) => deleteHabitMutation.mutate(id),
      addJournal,
      addCoachMessage,
      refreshCoach,
      logFocus,
      addWater,
      setSleep,
      focusSessionsToday: sessions,
      journaledToday: (journalQuery.data ?? []).some((j) => j.entryDate === todayKey),
      goalsCount: (goalsQuery.data ?? []).filter((g) => !g.completed).length,
    }),
    [
      loading,
      selectedDate,
      blocksQuery.data,
      weekPlan,
      habits,
      journalQuery.data,
      achievements,
      progression,
      coachQuery.data,
      focusMinutes,
      sessions,
      water,
      sleep,
      disciplineScore,
      weekTrend,
      monthTrend,
      heatmap,
      toggleBlockMutation,
      addBlockMutation,
      updateBlockMutation,
      deleteBlockMutation,
      toggleHabitMutation,
      addHabitMutation,
      deleteHabitMutation,
      addJournal,
      addCoachMessage,
      refreshCoach,
      logFocus,
      addWater,
      setSleep,
      todayKey,
      goalsQuery.data,
    ],
  );

  return <ArohaContext.Provider value={value}>{children}</ArohaContext.Provider>;
}

export function useAroha() {
  const ctx = useContext(ArohaContext);
  if (!ctx) throw new Error("useAroha must be used inside ArohaProvider");
  return ctx;
}
