import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  Repeat,
  Bell,
  TrendingUp,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import mark from "@/assets/aroha-mark.png";

export const Route = createFileRoute("/time-blocking-app")({
  head: () => ({
    meta: [
      { title: "AROHA — Time Blocking App for Daily Schedule Planning" },
      {
        name: "description",
        content:
          "AROHA is a time blocking app that helps you plan your day in focused blocks, set recurring weekly tasks, and get notified before every block starts. Build discipline with scheduled intentions.",
      },
      {
        property: "og:title",
        content: "AROHA — Time Blocking App for Daily Schedule Planning",
      },
      {
        property: "og:description",
        content:
          "Plan your day in time blocks, repeat tasks across weeks, and receive alerts before each block starts. The discipline-first time blocking app.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://aroha.app/time-blocking-app" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://aroha.app/time-blocking-app" },
    ],
  }),
  component: TimeBlockingApp,
});

const benefits = [
  {
    icon: Clock,
    title: "Intentional time blocks",
    text: "Divide your day into named blocks for deep work, exercise, meals and rest. Every block is a commitment, not a suggestion.",
  },
  {
    icon: Repeat,
    title: "Recurring weekly planning",
    text: "Build repeating routines for weekdays or weekends and plan up to eight weeks ahead in one action.",
  },
  {
    icon: Bell,
    title: "Automated block alerts",
    text: "Get a heads-up notification before each block starts, with a tap action that opens the exact task and date.",
  },
  {
    icon: ShieldCheck,
    title: "Protected focus time",
    text: "Link blocks to focus mode so your schedule becomes a barrier against distraction, not just a calendar.",
  },
  {
    icon: TrendingUp,
    title: "Completion feeds your score",
    text: "Every completed block contributes to your live discipline score, XP and rank progression.",
  },
  {
    icon: Sparkles,
    title: "AI coach aware of your schedule",
    text: "Your AI coach reads your time blocks and habits to suggest realistic daily adjustments.",
  },
];

function TimeBlockingApp() {
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
            The time blocking app that turns your calendar into discipline
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Time blocking is more than scheduling — it is a commitment system.
            AROHA helps you plan your day in focused blocks, repeat what
            matters, and follow through with notifications that keep you on
            track.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start time blocking — sign up free
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {benefits.map((b) => (
            <article
              key={b.title}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <b.icon className="size-5 text-primary" strokeWidth={1.75} />
              <h2 className="mt-3 text-sm font-semibold text-foreground">
                {b.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {b.text}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Why use a time blocking app?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Calendars remind you of meetings; time blocking claims space for
            your own priorities. AROHA combines blocks with habits, focus
            sessions and an AI coach so your schedule becomes a daily operating
            system, not just a list of events.
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
            Explore all AROHA features
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
