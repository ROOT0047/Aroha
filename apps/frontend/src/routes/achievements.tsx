import { createFileRoute } from "@tanstack/react-router";
import { Award, Lock } from "lucide-react";
import { AppShell } from "@/components/aroha/app-shell";
import { PageHeading } from "@/components/aroha/primitives";
import { useAroha } from "@/context/aroha";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — AROHA" },
      { name: "description", content: "Badges, levels and milestones earned through consistency." },
      { property: "og:title", content: "Achievements — AROHA" },
      { property: "og:description", content: "Badges earned through consistency, not intensity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const { achievements } = useAroha();
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <AppShell title="Achievements">
      <PageHeading title="Milestones" subtitle={`${unlocked} of ${achievements.length} unlocked`} />
      <ul className="grid grid-cols-2 gap-3">
        {achievements.map((a) => (
          <li
            key={a.id}
            className={cn("card-surface px-4 py-4", !a.unlocked && "opacity-55")}
          >
            {a.unlocked ? (
              <Award className="size-5 text-warning" strokeWidth={1.75} />
            ) : (
              <Lock className="size-5 text-muted-foreground" strokeWidth={1.75} />
            )}
            <p className="mt-2.5 text-sm text-foreground">{a.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.detail}</p>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
