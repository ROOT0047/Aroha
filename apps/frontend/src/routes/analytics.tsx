import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { AppShell } from "@/components/aroha/app-shell";
import { PageHeading, SectionHeader, StatTile } from "@/components/aroha/primitives";
import { useAroha } from "@/context/aroha";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — AROHA" },
      {
        name: "description",
        content: "Discipline score trends, habit heat maps, focus hours and productivity graphs.",
      },
      { property: "og:title", content: "Analytics — AROHA" },
      { property: "og:description", content: "Measure progress over months, not days." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

const ranges = ["Week", "Month"] as const;

function AnalyticsPage() {
  const { disciplineScore, focusMinutes, habits, weekTrend, monthTrend, heatmap } = useAroha();
  const [range, setRange] = useState<(typeof ranges)[number]>("Week");

  const data = range === "Week" ? weekTrend : monthTrend;
  const habitPct = habits.length
    ? Math.round((habits.filter((h) => h.completedToday).length / habits.length) * 100)
    : 0;
  const bestStreak = habits.length ? Math.max(...habits.map((h) => h.bestStreak)) : 0;

  return (
    <AppShell title="Analytics">
      <PageHeading title="Overview" subtitle="Trends beat single days." />

      <div className="mb-5 flex gap-1.5 rounded-2xl border border-border bg-surface p-1">
        {ranges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "flex-1 rounded-xl py-1.5 text-xs transition-colors",
              range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Discipline" value={`${disciplineScore}`} tone="primary" />
        <StatTile label="Habit rate" value={`${habitPct}`} suffix="%" tone="success" />
        <StatTile
          label="Focus today"
          value={`${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m`}
        />
        <StatTile label="Best streak" value={`${bestStreak}`} suffix="d" tone="warning" />
      </div>

      <section className="card-surface mt-5 px-4 py-4">
        <SectionHeader title="Discipline trend" />
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)" }}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "var(--foreground)",
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#scoreFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card-surface mt-4 px-4 py-4">
        <SectionHeader title="Blocks completed" />
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              />
              <Tooltip
                cursor={{ fill: "var(--accent)" }}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "var(--foreground)",
                }}
              />
              <Bar dataKey="tasks" fill="var(--secondary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card-surface mt-4 px-4 py-4">
        <SectionHeader title="Habit heat map" />
        <div className="grid grid-cols-13 gap-1">
          {heatmap.map((level, i) => {
            const intensity = habits.length ? Math.min(1, level / habits.length) : 0;
            return (
              <span
                key={i}
                className="aspect-square rounded-[3px]"
                style={{
                  background:
                    level <= 0
                      ? "var(--border)"
                      : `color-mix(in oklab, var(--primary) ${Math.round(25 + intensity * 75)}%, var(--border))`,
                }}
              />
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Last 13 weeks of habit check-ins.</p>
      </section>
    </AppShell>
  );
}
