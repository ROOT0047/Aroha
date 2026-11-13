import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";
import { useAroha } from "@/context/aroha";
import { cn } from "@/lib/utils";

/** The AROHA loop: Goal → Plan → Mission → Focus → Habit → Journal → Review → Level Up. */
export function TodayLoop() {
  const { goalsCount, schedule, focusSessionsToday, habits, journaledToday, disciplineScore } = useAroha();
  const steps = [
    { label: "Goal", to: "/goals", done: goalsCount > 0 },
    { label: "Plan", to: "/schedule", done: schedule.length > 0 },
    { label: "Mission", to: "/schedule", done: schedule.some((b) => b.completed) },
    { label: "Focus", to: "/focus", done: focusSessionsToday > 0 },
    { label: "Habit", to: "/habits", done: habits.some((h) => h.completedToday) },
    { label: "Journal", to: "/journal", done: journaledToday },
    { label: "Review", to: "/analytics", done: disciplineScore >= 50 },
    { label: "Level Up", to: "/level", done: disciplineScore >= 85 },
  ] as const;
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="card-surface mt-4 px-4 py-4">
      <div className="flex items-center justify-between">
        <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">Today's loop</p>
        <p className="num text-xs text-foreground">
          {doneCount}/{steps.length}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {steps.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[0.65rem] transition-colors",
              s.done ? "border-success/40 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {s.done ? (
              <CheckCircle2 className="size-4 text-success" strokeWidth={1.75} />
            ) : (
              <Circle className="size-4" strokeWidth={1.75} />
            )}
            {s.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
