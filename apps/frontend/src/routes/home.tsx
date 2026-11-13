import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, CheckCircle2, ChevronRight, Circle, Droplet, Moon, Shield } from "lucide-react";
import { AppShell } from "@/components/aroha/app-shell";
import { Meter, ScoreRing, SectionHeader, StatTile } from "@/components/aroha/primitives";
import { useAroha } from "@/context/aroha";
import { TodayLoop } from "@/components/aroha/today-loop";
import { useAuth } from "@/hooks/use-auth";
import { healthStats, profile } from "@/data/mock";
import { quoteForDate } from "@/data/quotes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Today — AROHA" },
      {
        name: "description",
        content: "Your discipline score, today's mission, focus time and habit progress at a glance.",
      },
      { property: "og:title", content: "Today — AROHA" },
      { property: "og:description", content: "Discipline score, mission and habit progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function scoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Holding";
  return "Slipping";
}

function timeGreeting(timezone?: string | null) {
  let hour = new Date().getHours();
  if (timezone) {
    try {
      hour = Number(
        new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone }).format(new Date()),
      );
    } catch {
      hour = new Date().getHours();
    }
  }
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function HomePage() {
  const {
    disciplineScore,
    schedule,
    habits,
    focusMinutes,
    water,
    sleep,
    toggleBlock,
    addWater,
    loading,
    achievements,
    progression,
  } = useAroha();
  const { user, profile: account } = useAuth();
  const name = account?.display_name ?? user?.email?.split("@")[0] ?? profile.name;

  const doneTasks = schedule.filter((b) => b.completed).length;
  const doneHabits = habits.filter((h) => h.completedToday).length;
  const habitPct = habits.length ? Math.round((doneHabits / habits.length) * 100) : 0;
  const mission = schedule.filter((b) => b.priority !== "Low").slice(0, 5);
  const bestStreak = habits.length ? Math.max(...habits.map((h) => h.streak)) : 0;
  const quote = quoteForDate();
  const earned = achievements.filter((a) => a.unlocked);


  return (
    <AppShell title="Home">
      <section className="rise">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{timeGreeting(account?.timezone)}</p>
        <h1 className="mt-1 text-2xl text-foreground">Daily Discipline Dashboard</h1>
        <p className="mt-1 text-sm text-foreground">{name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Stay focused. Stay silent. Let the results make the noise.
        </p>
      </section>

      <section className="card-surface mt-5 flex items-center gap-5 px-5 py-6">
        <ScoreRing value={disciplineScore} caption={scoreLabel(disciplineScore)} size={148} />
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
              Discipline
            </p>
            <p className="num mt-0.5 text-sm text-success">Today</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Habits</span>
              <span className="num text-foreground">{habitPct}%</span>
            </div>
            <Meter value={habitPct} />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Plan</span>
              <span className="num text-foreground">
                {doneTasks}/{schedule.length}
              </span>
            </div>
            <Meter value={schedule.length ? (doneTasks / schedule.length) * 100 : 0} tone="secondary" />
          </div>
        </div>
      </section>

      <TodayLoop />

      <section className="mt-4 grid grid-cols-4 gap-2">
        <StatTile label="Tasks" value={`${doneTasks}/${schedule.length}`} />
        <StatTile label="Habits" value={`${doneHabits}/${habits.length}`} tone="primary" />
        <StatTile
          label="Focus"
          value={`${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m`}
          tone="success"
        />
        <StatTile label="Streak" value={`${bestStreak}`} suffix="d" tone="warning" />
      </section>

      <Link to="/level" className="card-surface mt-4 block px-5 py-4 transition-colors hover:border-primary/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" strokeWidth={1.75} />
            <p className="text-sm text-foreground">
              Level {progression.level}
              <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-[0.65rem] text-warning">
                {progression.rank}
              </span>
            </p>
          </div>
          <p className="num text-[0.7rem] text-muted-foreground">
            {progression.levelXp}/{progression.levelSpan} XP
          </p>
        </div>
        <div className="mt-3">
          <Meter value={progression.progress} />
        </div>
        <p className="mt-2 text-[0.7rem] text-muted-foreground">
          {progression.xpToNext} XP to level {progression.level + 1}
          {progression.nextRank ? ` — next rank ${progression.nextRank}` : " — top rank held"}
        </p>
      </Link>

      <section className="mt-4">
        <SectionHeader
          title="Badges earned"
          action={
            <Link
              to="/achievements"
              className="flex items-center gap-0.5 text-xs text-primary transition-opacity hover:opacity-80"
            >
              View all <ChevronRight className="size-3.5" strokeWidth={2} />
            </Link>
          }
        />
        {earned.length === 0 ? (
          <p className="card-surface px-4 py-5 text-center text-xs text-muted-foreground">
            No badges yet — log a habit or finish a block to start earning.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {earned.map((a) => (
              <div key={a.id} className="card-surface min-w-[8.5rem] px-3 py-3">
                <Award className="size-4 text-warning" strokeWidth={1.75} />
                <p className="mt-2 text-xs text-foreground">{a.name}</p>
                <p className="mt-1 text-[0.65rem] leading-relaxed text-muted-foreground">
                  {a.detail}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>


      <section className="mt-7">
        <SectionHeader
          title="Today's Mission"
          action={
            <Link
              to="/schedule"
              className="flex items-center gap-0.5 text-xs text-primary transition-opacity hover:opacity-80"
            >
              View all <ChevronRight className="size-3.5" strokeWidth={2} />
            </Link>
          }
        />
        <ul className="card-surface divide-y divide-border overflow-hidden">
          {mission.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-muted-foreground">
              {loading ? "Loading…" : "Nothing planned yet — add a block on the Schedule page."}
            </li>
          ) : null}
          {mission.map((block) => (
            <li key={block.id}>
              <button
                onClick={() => toggleBlock(block.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
              >
                {block.completed ? (
                  <CheckCircle2 className="size-5 shrink-0 text-success" strokeWidth={1.75} />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                )}
                <span className="num w-12 shrink-0 text-xs text-muted-foreground">
                  {block.startTime}
                </span>
                <span
                  className={cn(
                    "flex-1 truncate text-sm",
                    block.completed ? "text-muted-foreground line-through" : "text-foreground",
                  )}
                >
                  {block.title}
                </span>
                <span className="num text-[0.7rem] text-muted-foreground">
                  {block.durationLabel}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="card-surface px-4 py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Droplet className="size-4" strokeWidth={1.75} />
            <span className="text-xs uppercase tracking-[0.12em]">Water</span>
          </div>
          <p className="num mt-2 text-xl text-foreground">
            {(water / 1000).toFixed(1)}
            <span className="ml-1 text-xs text-muted-foreground">
              / {healthStats.waterGoal / 1000} L
            </span>
          </p>
          <div className="mt-3">
            <Meter value={(water / healthStats.waterGoal) * 100} tone="secondary" />
          </div>
          <button
            onClick={() => addWater(250)}
            className="mt-3 w-full rounded-xl border border-border py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            + 250 ml
          </button>
        </div>
        <div className="card-surface px-4 py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Moon className="size-4" strokeWidth={1.75} />
            <span className="text-xs uppercase tracking-[0.12em]">Sleep</span>
          </div>
          <p className="num mt-2 text-xl text-foreground">
            {Math.floor(sleep)}h {Math.round((sleep % 1) * 60)}m
          </p>
          <div className="mt-3">
            <Meter value={(sleep / healthStats.sleepGoal) * 100} tone="primary" />
          </div>
          <p className="mt-3 text-[0.7rem] text-muted-foreground">
            Target {healthStats.sleepGoal}h — bed by 22:15
          </p>
        </div>
      </section>

      <section className="card-surface mt-4 px-5 py-5">
        <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
          Today's quote
        </p>
        <p className="mt-2 text-base leading-relaxed text-foreground">{quote.text}</p>
        <p className="mt-2 text-sm text-muted-foreground">{quote.translation}</p>
        <p className="mt-3 text-xs text-primary">— {quote.author}</p>
      </section>
    </AppShell>
  );
}
