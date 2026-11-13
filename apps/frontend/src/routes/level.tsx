import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, CheckCircle2, Flame, Lock, Sparkles, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/aroha/app-shell";
import { EmptyNote, Meter, PageHeading, SectionHeader, StatTile } from "@/components/aroha/primitives";
import { isoDate, useAroha } from "@/context/aroha";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/level")({
  head: () => ({
    meta: [
      { title: "Level & Rank — AROHA" },
      { name: "description", content: "Your XP, rank, badges, and progress toward the next level." },
      { property: "og:title", content: "Level & Rank — AROHA" },
      { property: "og:description", content: "Track XP, ranks, and badges earned through daily execution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LevelPage,
});

const RANK_LADDER = [
  { level: 1, name: "Novice" },
  { level: 4, name: "Disciplined" },
  { level: 8, name: "Focused" },
  { level: 12, name: "Relentless" },
  { level: 18, name: "Elite" },
  { level: 25, name: "Sovereign" },
];

function LevelPage() {
  const { progression, achievements, habits, schedule, selectedDate, disciplineScore } = useAroha();

  const isToday = selectedDate === isoDate(new Date());
  const habitsDone = habits.filter((h) => h.completedToday);
  const blocksDone = isToday ? schedule.filter((b) => b.completed) : [];
  const habitXp = habitsDone.length * 12;
  const blockXp = blocksDone.length * 6;
  const todayXp = habitXp + blockXp;
  const dailyGoal = habits.length * 12 + (isToday ? schedule.length * 6 : 0);

  const unlocked = achievements.filter((a) => a.unlocked);

  const goals = [
    {
      label: `Check in ${habits.length} habits`,
      earned: habitXp,
      target: habits.length * 12,
      done: habitsDone.length,
      total: habits.length,
    },
    ...(isToday && schedule.length > 0
      ? [
          {
            label: `Complete ${schedule.length} time blocks`,
            earned: blockXp,
            target: schedule.length * 6,
            done: blocksDone.length,
            total: schedule.length,
          },
        ]
      : []),
  ];

  return (
    <AppShell title="Level">
      <PageHeading title={`Level ${progression.level}`} subtitle={`Rank — ${progression.rank}`} />

      {/* XP ring */}
      <section className="card-surface rise flex flex-col items-center px-4 py-6">
        <div className="relative grid place-items-center" style={{ width: 176, height: 176 }}>
          <svg width={176} height={176} className="-rotate-90">
            <circle cx={88} cy={88} r={80} fill="none" stroke="var(--border)" strokeWidth={12} />
            <circle
              cx={88}
              cy={88}
              r={80}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 80}
              strokeDashoffset={(1 - progression.progress / 100) * 2 * Math.PI * 80}
              style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="num text-4xl text-foreground">{progression.xp}</span>
            <span className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              Total XP
            </span>
          </div>
        </div>
        <div className="mt-5 w-full">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <span className="num text-foreground">{progression.levelXp}</span> /{" "}
              {progression.levelSpan} XP
            </span>
            <span className="num text-primary">{progression.progress}%</span>
          </div>
          <Meter value={progression.progress} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {progression.xpToNext} XP to level {progression.level + 1}
            {progression.nextRank ? ` — next rank ${progression.nextRank}` : " — top rank held"}
          </p>
        </div>
      </section>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatTile label="Today" value={`+${todayXp}`} suffix="XP" tone="primary" icon={TrendingUp} />
        <StatTile label="Score" value={String(disciplineScore)} suffix="/100" icon={Flame} />
        <StatTile label="Badges" value={String(unlocked.length)} suffix={`/${achievements.length}`} icon={Award} />
      </div>

      {/* Daily XP goals */}
      <SectionHeader title="Daily XP goals" className="mt-6" />
      <ul className="space-y-2.5">
        {goals.map((g) => (
          <li key={g.label} className="card-surface px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm text-foreground">{g.label}</p>
              <span className="num shrink-0 text-xs text-muted-foreground">
                {g.done}/{g.total} · +{g.earned} XP
              </span>
            </div>
            <Meter value={g.earned} max={Math.max(g.target, 1)} tone="success" className="mt-2.5" />
          </li>
        ))}
        {goals.length === 0 && <EmptyNote>No goals for this date yet.</EmptyNote>}
      </ul>
      {dailyGoal > 0 && (
        <p className="mt-2.5 text-xs text-muted-foreground">
          Daily target {dailyGoal} XP — {todayXp} earned ({Math.round((todayXp / dailyGoal) * 100)}%)
        </p>
      )}

      {/* Rank ladder */}
      <SectionHeader title="Rank ladder" className="mt-6" />
      <ul className="card-surface divide-y divide-border/60 px-4">
        {RANK_LADDER.map((r) => {
          const reached = progression.level >= r.level;
          const current = progression.rank === r.name;
          return (
            <li key={r.name} className="flex items-center gap-3 py-3">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  reached ? "bg-primary/15 text-primary" : "bg-border/40 text-muted-foreground",
                )}
              >
                {reached ? (
                  <CheckCircle2 className="size-4" strokeWidth={1.75} />
                ) : (
                  <Lock className="size-4" strokeWidth={1.75} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", reached ? "text-foreground" : "text-muted-foreground")}>
                  {r.name}
                  {current && <span className="ml-2 text-xs text-primary">current</span>}
                </p>
              </div>
              <span className="num shrink-0 text-xs text-muted-foreground">Lv {r.level}</span>
            </li>
          );
        })}
      </ul>

      {/* Badges */}
      <SectionHeader
        title="Badges earned"
        className="mt-6"
        action={
          <Link to="/achievements" className="text-xs text-primary">
            View all
          </Link>
        }
      />
      {unlocked.length === 0 ? (
        <EmptyNote>No badges yet — keep executing daily.</EmptyNote>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {unlocked.map((a) => (
            <li key={a.id} className="card-surface px-4 py-4">
              <Award className="size-5 text-warning" strokeWidth={1.75} />
              <p className="mt-2.5 text-sm text-foreground">{a.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.detail}</p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-5 flex items-center justify-center gap-1.5 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        <Sparkles className="size-3.5" strokeWidth={1.75} />
        XP sources — habits 12 · blocks 6 · streaks 20 · badges 75
      </p>
    </AppShell>
  );
}
