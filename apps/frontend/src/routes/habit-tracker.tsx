import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Flame,
  TrendingUp,
  Sparkles,
  Calendar,
  Hourglass,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import mark from "@/assets/aroha-mark.png";

export const Route = createFileRoute("/habit-tracker")({
  head: () => ({
    meta: [
      { title: "Best Habit Tracker App with AI Coaching — AROHA" },
      {
        name: "description",
        content:
          "AROHA goes beyond a habit tracker: daily check-ins, streaks, a live discipline score, schedule planning and an AI coach that keeps you consistent. Free to start.",
      },
      {
        property: "og:title",
        content: "Best Habit Tracker App with AI Coaching — AROHA",
      },
      {
        property: "og:description",
        content:
          "Track habits, build streaks and measure real discipline with a live score and AI coach — more than a checkbox habit tracker.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://aroha.app/habit-tracker" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://aroha.app/habit-tracker" },
    ],
  }),
  component: HabitTracker,
});

const pillars = [
  {
    icon: Flame,
    title: "Streaks that actually motivate",
    text: "Check in daily and build unbroken streaks. AROHA surfaces your longest runs and current momentum so a missed day never becomes a missed month.",
  },
  {
    icon: TrendingUp,
    title: "A discipline score, not just checkboxes",
    text: "Most habit trackers count taps. AROHA computes a live discipline score from your check-ins, completed schedule blocks and focus sessions — so you see real consistency, not vanity streaks.",
  },
  {
    icon: Sparkles,
    title: "An AI coach that knows your data",
    text: "Chat with an AI coach that reads your habits, schedule and discipline score, then gives concrete advice on what to fix next — something no ordinary habit tracker app offers.",
  },
  {
    icon: Calendar,
    title: "Habits connected to your schedule",
    text: "Plan habits inside time-blocked days with reminders before every block. Tracking and doing live in the same place.",
  },
  {
    icon: Hourglass,
    title: "Focus sessions built in",
    text: "Pair habits with distraction-free focus timers, then review focused hours alongside your streaks in analytics.",
  },
  {
    icon: Trophy,
    title: "Levels, ranks and badges",
    text: "Every check-in earns XP. Climb ranks and unlock badges as your discipline compounds over weeks and months.",
  },
];

const comparison = [
  "Daily habit check-ins with streaks",
  "Live discipline score from real behavior",
  "AI coach with access to your data",
  "Time-block schedule with reminders",
  "Focus timer and health tracking",
  "XP, levels, ranks and badges",
];

function HabitTracker() {
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
            The best habit tracker app for real discipline
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Looking for the best habit tracker app? Most trackers stop at
            checkboxes and streaks. AROHA is a personal evolution system:
            it tracks your habits, plans your day, times your focus sessions
            and scores your consistency — with an AI coach that keeps you
            honest.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start tracking free
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {pillars.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <p.icon className="size-5 text-primary" strokeWidth={1.75} />
              <h2 className="mt-3 text-sm font-semibold text-foreground">
                {p.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {p.text}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            What you get in one app
          </h2>
          <ul className="mt-4 space-y-2.5">
            {comparison.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            A traditional habit tracker tells you whether you showed up.
            AROHA shows you whether your whole system — schedule, habits,
            focus and recovery — is working, and helps you fix what is not.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create your account
          </Link>
        </section>

        <footer className="flex flex-col items-center gap-2 pb-4 text-center text-xs text-muted-foreground">
          <Link to="/features" className="underline-offset-4 hover:underline">
            Explore all discipline app features
          </Link>
          <Link to="/" className="underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </footer>
      </main>
    </div>
  );
}
