import { createFileRoute } from "@tanstack/react-router";
import { Check, Flame, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/aroha/app-shell";
import { PageHeading } from "@/components/aroha/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAroha } from "@/context/aroha";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/habits")({
  head: () => ({
    meta: [
      { title: "Habits — AROHA" },
      {
        name: "description",
        content: "Daily, weekly and monthly habits with streaks, misses and 30-day consistency grids.",
      },
      { property: "og:title", content: "Habits — AROHA" },
      { property: "og:description", content: "Build streaks. Track every miss honestly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HabitsPage,
});

const filters = ["All", "Daily", "Weekly", "Monthly"] as const;

function HabitsPage() {
  const { habits, toggleHabit, addHabit, deleteHabit, loading } = useAroha();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [cadence, setCadence] = useState<"Daily" | "Weekly" | "Monthly">("Daily");

  const visible = habits.filter((h) => filter === "All" || h.cadence === filter);
  const done = habits.filter((h) => h.completedToday).length;

  function submit() {
    if (!title.trim()) {
      toast.error("Name the habit first");
      return;
    }
    addHabit({ title: title.trim(), cadence, goal: 1, unit: "session" });
    toast.success("Habit added");
    setTitle("");
    setOpen(false);
  }

  return (
    <AppShell title="Habits">
      <PageHeading
        title="Consistency"
        subtitle={`${done} of ${habits.length} completed today`}
      />

      <div className="mb-5 flex gap-1.5 rounded-2xl border border-border bg-surface p-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex-1 rounded-xl py-1.5 text-xs transition-colors",
              filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-xs tracking-[0.24em] text-muted-foreground">LOADING…</p>
      ) : habits.length === 0 ? (
        <div className="card-surface px-5 py-8 text-center">
          <p className="text-sm text-foreground">No habits yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add the first habit you want to hold every day.
          </p>
        </div>
      ) : null}

      <ul className="space-y-3">
        {visible.map((habit) => (
          <li key={habit.id} className="card-surface px-4 py-3.5">
            <div className="flex items-center gap-3">
              <button
                aria-label={`Toggle ${habit.title}`}
                onClick={() => toggleHabit(habit.id)}
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full border transition-colors",
                  habit.completedToday
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <Check className="size-4" strokeWidth={2.2} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{habit.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {habit.cadence} · goal {habit.goal} {habit.unit}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-warning">
                <Flame className="size-3.5" strokeWidth={2} />
                <span className="num text-sm">{habit.streak}</span>
              </div>
              <button
                aria-label={`Delete ${habit.title}`}
                onClick={() => deleteHabit(habit.id)}
                className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="mt-3 flex gap-[3px]">
              {habit.history.map((hit, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    hit ? "bg-primary" : "bg-border",
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-[0.68rem] text-muted-foreground">
              Best streak <span className="num text-foreground">{habit.bestStreak}</span> days
            </p>
          </li>
        ))}
      </ul>

      <Button onClick={() => setOpen(true)} className="mt-5 w-full gap-2">
        <Plus className="size-4" strokeWidth={2} />
        Add habit
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl border-border bg-surface">
          <SheetHeader>
            <SheetTitle>New habit</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="habit-title">Habit</Label>
              <Input
                id="habit-title"
                value={title}
                maxLength={60}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Read 30 minutes"
              />
            </div>
            <div className="flex gap-1.5 rounded-2xl border border-border bg-background p-1">
              {(["Daily", "Weekly", "Monthly"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCadence(c)}
                  className={cn(
                    "flex-1 rounded-xl py-1.5 text-xs transition-colors",
                    cadence === c ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <SheetFooter>
            <Button onClick={submit} className="w-full">
              Add habit
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
