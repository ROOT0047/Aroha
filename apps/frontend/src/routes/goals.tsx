import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/aroha/app-shell";
import { Meter, PageHeading, SectionHeader } from "@/components/aroha/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Goals — AROHA" },
      { name: "description", content: "Define the goals that drive your daily missions, focus and growth." },
      { property: "og:title", content: "Goals — AROHA" },
      { property: "og:description", content: "Goals that drive your daily missions and evolution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GoalsPage,
});

const attributes = ["discipline", "focus", "knowledge", "fitness", "clarity", "consistency", "productivity"];

function GoalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [attribute, setAttribute] = useState("discipline");
  const [targetDate, setTargetDate] = useState("");

  const goalsQuery = useQuery({
    queryKey: ["goals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["goals"] });

  const add = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const t = title.trim();
      const w = why.trim();
      if (!t) throw new Error("Give your goal a title");
      if (t.length > 120) throw new Error("Title must be 120 characters or less");
      if (w.length > 500) throw new Error("Why must be 500 characters or less");
      if (targetDate && targetDate < new Date().toISOString().slice(0, 10))
        throw new Error("Target date can't be in the past");
      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        title: t,
        why: w || null,
        attribute,
        target_date: targetDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setWhy("");
      setTargetDate("");
      toast.success("Goal added");
      void refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save goal"),
  });

  const update = useMutation({
    mutationFn: async (v: { id: string; progress?: number; completed?: boolean }) => {
      const { id, ...patch } = v;
      if (patch.progress !== undefined) patch.progress = Math.max(0, Math.min(100, Math.round(patch.progress)));
      const { error } = await supabase.from("goals").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void refresh(),
    onError: () => toast.error("Could not update goal"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Goal deleted");
      void refresh();
    },
    onError: () => toast.error("Could not delete goal"),
  });

  const goals = goalsQuery.data ?? [];

  return (
    <AppShell title="Goals">
      <PageHeading title="Your Goals" subtitle="Goal → Plan → Execute → Reflect → Adapt → Level up" />

      <form
        className="card-surface flex flex-col gap-2.5 px-4 py-4"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate();
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Pass my exam in 30 days"
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
        <input
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          placeholder="Why does this matter? (optional)"
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
        <div className="flex gap-2">
          <select
            value={attribute}
            onChange={(e) => setAttribute(e.target.value)}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm capitalize text-foreground"
          >
            {attributes.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
          />
        </div>
        <button
          type="submit"
          disabled={!title.trim() || add.isPending}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Plus className="size-4" /> Add goal
        </button>
      </form>

      <SectionHeader title={`Active goals (${goals.filter((g) => !g.completed).length})`} className="mt-6" />
      {goals.length === 0 && !goalsQuery.isLoading && (
        <p className="card-surface px-4 py-6 text-center text-sm text-muted-foreground">
          Set your first goal — everything in Aroha flows from it.
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {goals.map((g) => (
          <li key={g.id} className={cn("card-surface px-4 py-4", g.completed && "opacity-60")}>
            <div className="flex items-start gap-3">
              <Target className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm text-foreground", g.completed && "line-through")}>{g.title}</p>
                {g.why && <p className="mt-0.5 text-xs text-muted-foreground">{g.why}</p>}
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                  {g.attribute}
                  {g.target_date ? ` · by ${g.target_date}` : ""}
                </p>
              </div>
              <button
                aria-label="Mark complete"
                onClick={() => update.mutate({ id: g.id, completed: !g.completed, progress: g.completed ? g.progress : 100 })}
                className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-primary"
              >
                <Check className="size-4" />
              </button>
              <button
                aria-label="Delete goal"
                onClick={() => remove.mutate(g.id)}
                className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <Meter value={g.progress} />
              </div>
              <span className="num w-9 text-right text-xs text-muted-foreground">{g.progress}%</span>
            </div>
            {!g.completed && (
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                defaultValue={g.progress}
                onMouseUp={(e) => update.mutate({ id: g.id, progress: Number(e.currentTarget.value) })}
                onTouchEnd={(e) => update.mutate({ id: g.id, progress: Number(e.currentTarget.value) })}
                className="mt-2 w-full accent-[var(--primary)]"
                aria-label="Update progress"
              />
            )}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
