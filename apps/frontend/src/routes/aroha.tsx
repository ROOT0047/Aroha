import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  Flame,
  Hourglass,
  HeartPulse,
  NotebookPen,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import mark from "@/assets/aroha-mark.png";

export const Route = createFileRoute("/aroha")({
  head: () => ({
    meta: [
      { title: "AROHA — The Personal Evolution System" },
      {
        name: "description",
        content:
          "Discover the AROHA brand: a personal evolution system built on intention, consistency, focus and reflection, with habit streaks, time blocks and an AI coach.",
      },
      {
        property: "og:title",
        content: "AROHA — The Personal Evolution System",
      },
      {
        property: "og:description",
        content:
          "The AROHA story: four pillars of discipline, daily habit streaks, focused time blocks and an AI coach that keeps you accountable.",
      },

      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://aroha.app/aroha" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://aroha.app/aroha" },
    ],
  }),
  component: BrandPage,
});

const pillars = [
  {
    icon: Target,
    title: "Intention",
    text: "Discipline starts with a clear aim. AROHA turns your goals into a daily plan you can follow.",
  },
  {
    icon: Flame,
    title: "Consistency",
    text: "Habits compound when they are tracked. Daily check-ins, streaks and reminders keep you on the path.",
  },
  {
    icon: Hourglass,
    title: "Focus",
    text: "Deep work requires protection. Focus mode blocks noise and measures your concentrated hours.",
  },
  {
    icon: TrendingUp,
    title: "Progress",
    text: "XP, levels, ranks and badges turn effort into visible momentum you can trust.",
  },
];

const features = [
  {
    icon: Calendar,
    title: "Schedule planning",
    text: "Plan your day in time blocks and set recurring weekly tasks with automated notifications.",
  },
  {
    icon: Flame,
    title: "Habit tracking",
    text: "Check in daily, build streaks and watch your consistency compound.",
  },
  {
    icon: Hourglass,
    title: "Deep focus",
    text: "Run distraction-free focus timers and review your focused hours.",
  },
  {
    icon: HeartPulse,
    title: "Health monitoring",
    text: "Track sleep, training and recovery so discipline never burns you out.",
  },
  {
    icon: NotebookPen,
    title: "Daily journal",
    text: "Write reflections with a title and mood, then revisit them in analytics.",
  },
  {
    icon: Sparkles,
    title: "AI coach",
    text: "Chat with a coach that knows your habits, schedule and discipline score.",
  },
  {
    icon: TrendingUp,
    title: "Discipline score",
    text: "A live score built from real check-ins, completed blocks and streaks.",
  },
  {
    icon: Trophy,
    title: "Levels & badges",
    text: "Earn XP, climb ranks and unlock badges as you progress.",
  },
];

function BrandPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[28rem] -translate-x-1/2 rounded-full opacity-45 blur-[120px]"
        style={{ background: "var(--primary)" }}
      />
      <main className="relative mx-auto flex w-full max-w-2xl flex-col gap-12 px-6 py-14">
        <header className="flex flex-col items-center text-center">
          <img
            src={mark}
            alt="AROHA logo"
            width={816}
            height={816}
            className="size-20 drop-shadow-[0_0_32px_oklch(0.618_0.207_288/0.55)]"
          />
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            AROHA
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Your Personal Evolution System.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            AROHA is a personal evolution system for your life. Plan your
            schedule, build unbreakable habits, focus deeply, track your health,
            journal daily and learn from an AI coach — all in one place.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start your ascent
              <ArrowRight className="size-4" strokeWidth={1.75} />
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center justify-center rounded-2xl border border-border bg-surface px-8 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Explore features
            </Link>
          </div>
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

        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Built for people who take self-mastery seriously
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            AROHA is not a simple to-do list. It is a complete operating system
            for discipline: your schedule, habits, focus, health, journal and
            AI coach work together to turn intention into daily execution.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="text-left">
                <div className="flex items-center gap-2">
                  <f.icon className="size-4 text-primary" strokeWidth={1.75} />
                  <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-primary p-8 text-center text-primary-foreground">
          <h2 className="text-xl font-bold tracking-tight">
            Your next level is one decision away.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed opacity-90">
            Join AROHA and turn discipline into a system you can see, measure and
            improve every single day.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-foreground px-8 py-3.5 text-sm font-medium text-primary transition-colors hover:bg-primary-foreground/90"
          >
            Create your free account
            <ArrowRight className="size-4" strokeWidth={1.75} />
          </Link>
        </section>

        <footer className="flex flex-col items-center gap-2 pb-4 text-center text-xs text-muted-foreground">
          <Link to="/features" className="underline-offset-4 hover:underline">
            Explore AROHA features
          </Link>
          <Link to="/habit-tracker" className="underline-offset-4 hover:underline">
            Best habit tracker app
          </Link>
          <Link to="/time-blocking-app" className="underline-offset-4 hover:underline">
            Time blocking app
          </Link>
          <Link to="/" className="underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </footer>
      </main>
    </div>
  );
}
