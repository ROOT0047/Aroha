import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/aroha/app-shell";
import { Meter, PageHeading } from "@/components/aroha/primitives";
import { learningItems } from "@/data/mock";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learning — AROHA" },
      { name: "description", content: "Books, courses, languages and skill practice tracked by progress." },
      { property: "og:title", content: "Learning — AROHA" },
      { property: "og:description", content: "Track books, courses and skills by real progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  return (
    <AppShell title="Learn">
      <PageHeading title="Learning" subtitle={`${learningItems.length} active tracks`} />
      <ul className="space-y-3">
        {learningItems.map((item) => (
          <li key={item.id} className="card-surface px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm text-foreground">{item.title}</p>
              <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-0.5 text-[0.65rem] text-primary">
                {item.type}
              </span>
            </div>
            <Meter value={item.progress} className="mt-3" />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.detail}</span>
              <span className="num text-foreground">{item.progress}%</span>
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
