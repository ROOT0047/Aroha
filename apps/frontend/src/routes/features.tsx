import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calendar,
  Flame,
  Hourglass,
  HeartPulse,
  NotebookPen,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";
import mark from "@/assets/aroha-mark.png";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "AROHA — The Discipline App for Habits, Focus and Schedule" },
      {
        name: "description",
        content:
          "AROHA is a discipline app that unifies schedule planning, habit streaks, deep focus sessions, health tracking, journaling and AI coaching into one daily operating system.",
      },
      {
        property: "og:title",
        content: "AROHA — The Discipline App for Habits, Focus and Schedule",
      },
      {
        property: "og:description",
        content:
          "Build discipline with schedule planning, habit streaks, focus sessions, health tracking and an AI coach — all in one app.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://aroha.app/features" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://aroha.app/features" },
    ],
  }),
  component: Features,
});

const features = [
  {
    icon: Calendar,
    title: "Schedule planning",
    text: "Plan your day in time blocks, set recurring weekly tasks, and get a notification before every block starts.",
  },
  {
    icon: Flame,
    title: "Habit tracking with streaks",
    text: "Check in daily, build unbroken streaks and watch your consistency compound across weeks.",
  },
  {
    icon: Hourglass,
    title: "Deep focus sessions",
    text: "Run distraction-free focus timers with focus-mode alerts, then review your focused hours in analytics.",
  },
  {
    icon: HeartPulse,
    title: "Health monitoring",
    text: "Track sleep, training and recovery alongside your work so discipline never burns you out.",
  },
  {
    icon: NotebookPen,
    title: "Daily journal",
    text: "Write and save daily reflections with a title and mood, and revisit them from your analytics view.",
  },
  {
    icon: Sparkles,
    title: "AI coach",
    text: "Chat with an AI coach that knows your habits, schedule and discipline score, and gives concrete advice.",
  },
  {
    icon: TrendingUp,
    title: "Discipline score & analytics",
    text: "A live discipline score computed from your real check-ins, completed blocks and streaks — with trends over time.",
  },
  {
    icon: Trophy,
    title: "Levels, ranks & badges",
    text: "Earn XP for every completed block and habit check-in, climb ranks and unlock badges as you progress.",
  },
];

function Features() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[28rem] -translate-x-1/2 rounded-full opacity-45 blur-[120px]"
        style={{ background: "var(--primary)" }}
      />
      <main className="relative mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-14">
        <header className="flex flex-col items-center text-center">
          <img
            src={mark}
            alt="AROHA logo"
            width={816}
            height={816}
            className="size-16 drop-shadow-[0_0_28px_oklch(0.618_0.207_288/0.55)]"
          />
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            AROHA
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            The discipline app that runs your whole day
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Discipline is not motivation — it is a system. AROHA is a
            discipline app that turns your intentions into scheduled blocks,
            tracked habits, focused sessions and measurable progress, with an
            AI coach keeping you honest.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start building discipline — sign up free
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <f.icon className="size-5 text-primary" strokeWidth={1.75} />
              <h2 className="mt-3 text-sm font-semibold text-foreground">
                {f.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {f.text}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Why a discipline app instead of another to-do list?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            To-do lists record what you intend. AROHA measures what you
            actually do: every completed block, every habit check-in and every
            focus session feeds your discipline score, level and rank. You see
            exactly where you are consistent and where you slip — and the AI
            coach helps you correct course.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create your account
          </Link>
        </section>

        <footer className="flex flex-col items-center gap-2 pb-4 text-center text-xs text-muted-foreground">
          <Link to="/time-blocking-app" className="underline-offset-4 hover:underline">
            AROHA time blocking app
          </Link>
          <Link to="/habit-tracker" className="underline-offset-4 hover:underline">
            Why AROHA is the best habit tracker app
          </Link>
          <Link to="/" className="underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </footer>
      </main>
    </div>
  );
}
