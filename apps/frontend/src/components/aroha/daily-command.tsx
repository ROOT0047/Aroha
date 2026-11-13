import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, CheckCircle2, Circle, Loader2, Moon, Sparkles, Sun } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { generateReview, type Mission, type PlanBlock } from "@/lib/api";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  kind: "morning" | "evening";
  summary: string;
  missions: Mission[];
  plan: PlanBlock[];
  insights: string[];
};

export function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function localTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function useDailyReviews() {
  const { user } = useAuth();
  const date = localDate();
  const query = useQuery({
    queryKey: ["daily-reviews", user?.id, date],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_reviews")
        .select("id, kind, summary, missions, plan, insights")
        .eq("review_date", date);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Review[];
      return {
        morning: rows.find((r) => r.kind === "morning") ?? null,
        evening: rows.find((r) => r.kind === "evening") ?? null,
      };
    },
  });
  return { date, ...query };
}

export function DailyCommand() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const run = generateReview;
  const { date, data, isLoading, error: loadError, refetch } = useDailyReviews();
  const evening = new Date().getHours() >= 18;
  const [tab, setTab] = useState<"morning" | "evening">(evening ? "evening" : "morning");
  const [applied, setApplied] = useState(false);
  const review = tab === "morning" ? data?.morning : data?.evening;
  const key = ["daily-reviews", user?.id, date];

  const generate = useMutation({
    mutationFn: (kind: "morning" | "evening") => run({ data: { kind, date, now: localTime() } }),
    onSuccess: () => {
      setApplied(false);
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "AROHA AI failed"),
  });

  const toggleMission = useMutation({
    mutationFn: async (missionId: string) => {
      const m = data?.morning;
      if (!m) return;
      const missions = m.missions.map((x) => (x.id === missionId ? { ...x, done: !x.done } : x));
      qc.setQueryData(key, { ...data, morning: { ...m, missions } });
      const { error } = await supabase.from("daily_reviews").update({ missions }).eq("id", m.id);
      if (error) throw error;
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: key });
      toast.error(e instanceof Error ? e.message : "Could not update mission");
    },
  });

  const applyPlan = useMutation({
    mutationFn: async (plan: PlanBlock[]) => {
      if (!user?.id || !plan.length) return;
      const cap = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);
      const { error } = await supabase.from("time_blocks").insert(
        plan.map((b) => ({
          user_id: user.id,
          block_date: date,
          title: b.title,
          description: "Planned by AROHA AI",
          start_time: b.start,
          end_time: b.end,
          priority: cap(b.priority),
          color: b.priority === "high" ? "primary" : "secondary",
        })),
      );
      if (error) throw error;
    },
    onSuccess: () => {
      setApplied(true);
      qc.invalidateQueries({ queryKey: ["blocks"] });
      qc.invalidateQueries({ queryKey: ["blocks-history"] });
      toast.success("Plan added to today's schedule");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add plan"),
  });

  const missions = data?.morning?.missions ?? [];
  const doneMissions = missions.filter((m) => m.done).length;

  return (
    <section className="card-surface mt-4 px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" strokeWidth={1.75} />
          <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">AROHA AI · Daily command</p>
        </div>
        <div className="flex rounded-full border border-border p-0.5 text-[0.65rem]">
          {(["morning", "evening"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 capitalize transition-colors",
                tab === k ? "bg-primary/15 text-foreground" : "text-muted-foreground",
              )}
            >
              {k === "morning" ? <Sun className="size-3" /> : <Moon className="size-3" />}
              {k}
            </button>
          ))}
        </div>
      </div>

      {loadError ? (
        <div className="mt-3 text-sm text-muted-foreground">
          Could not load today's review.{" "}
          <button className="text-primary underline" onClick={() => refetch()}>Retry</button>
        </div>
      ) : isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      ) : !review ? (
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">
            {tab === "morning"
              ? "Get your briefing, 3–5 missions and an adaptive plan built from your goals, habits and last 7 days."
              : "Close the day: AROHA AI reviews missions, focus, habits and your journal, then adjusts tomorrow."}
          </p>
          <button
            onClick={() => generate.mutate(tab)}
            disabled={generate.isPending}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm text-primary-foreground disabled:opacity-60"
          >
            {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {tab === "morning" ? "Start morning briefing" : "Run evening review"}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          <p className="text-sm leading-relaxed text-foreground">{review.summary}</p>

          {tab === "morning" && missions.length > 0 && (
            <div>
              <div className="flex justify-between text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                <span>Daily missions</span>
                <span className="num text-foreground">{doneMissions}/{missions.length}</span>
              </div>
              <ul className="mt-2 space-y-1.5">
                {missions.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => toggleMission.mutate(m.id)}
                      className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-2 text-left"
                    >
                      {m.done ? (
                        <CheckCircle2 className="size-4 shrink-0 text-success" strokeWidth={1.75} />
                      ) : (
                        <Circle className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                      )}
                      <span className={cn("flex-1 text-sm", m.done ? "text-muted-foreground line-through" : "text-foreground")}>
                        {m.title}
                      </span>
                      <span className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">{m.attribute}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === "morning" && review.plan.length > 0 && (
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">Adaptive plan</p>
              <ul className="mt-2 space-y-1">
                {review.plan.map((b, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="num w-24 text-xs text-muted-foreground">{b.start}–{b.end}</span>
                    <span className="flex-1 text-foreground">{b.title}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => applyPlan.mutate(review.plan)}
                disabled={applied || applyPlan.isPending}
                className="mt-2 flex items-center gap-2 rounded-lg border border-primary/40 px-3 py-1.5 text-xs text-foreground disabled:opacity-50"
              >
                <CalendarPlus className="size-3.5" />
                {applied ? "Added to schedule" : "Add plan to today"}
              </button>
            </div>
          )}

          {review.insights.length > 0 && (
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                {tab === "morning" ? "Adaptations" : "Win · Gap · Tomorrow"}
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                {review.insights.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          <button
            onClick={() => generate.mutate(tab)}
            disabled={generate.isPending}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {generate.isPending ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            Regenerate
          </button>
        </div>
      )}
    </section>
  );
}
