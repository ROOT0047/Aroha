import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Award, ChevronRight, LogOut, Pencil } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/aroha/app-shell";
import { Meter, PageHeading, SectionHeader, StatTile } from "@/components/aroha/primitives";
import { useAroha } from "@/context/aroha";
import { useAuth } from "@/hooks/use-auth";
import { profile } from "@/data/mock";
import mark from "@/assets/aroha-mark.png";

export const Route = createFileRoute("/profile/")({
  head: () => ({
    meta: [
      { title: "Profile — AROHA" },
      {
        name: "description",
        content: "Your rank, level, lifetime discipline stats and unlocked achievements.",
      },
      { property: "og:title", content: "Profile — AROHA" },
      { property: "og:description", content: "Rank, level and lifetime discipline stats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const links = [
  { to: "/profile/edit", label: "Edit profile" },
  { to: "/achievements", label: "Achievements" },
  { to: "/health", label: "Health" },
  { to: "/learn", label: "Learning" },
  { to: "/reminders", label: "Reminders" },
  { to: "/sync", label: "Sync & backup" },
  { to: "/settings", label: "Settings" },
] as const;

function ProfilePage() {
  const { disciplineScore, habits, achievements, progression } = useAroha();
  const { user, profile: account, avatarSrc, signOut } = useAuth();
  const navigate = useNavigate();
  const name = account?.display_name ?? user?.email?.split("@")[0] ?? profile.name;

  return (
    <AppShell title="Profile">
      <PageHeading title="Your Profile" subtitle="Rank, level and lifetime discipline stats" />
      <div className="card-surface flex items-center gap-4 px-4 py-4">
        <img src={avatarSrc ?? mark} alt="" className="size-14 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-base text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email ?? profile.email}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[0.65rem] text-primary">
              Level {progression.level}
            </span>
            <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-[0.65rem] text-warning">
              {progression.rank}
            </span>
          </div>
        </div>
        <Link
          to="/profile/edit"
          aria-label="Edit profile"
          className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
        >
          <Pencil className="size-4" strokeWidth={1.75} />
        </Link>
      </div>

      <div className="card-surface mt-3 px-4 py-4">
        <div className="flex items-end justify-between">
          <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
            Progression
          </p>
          <p className="num text-xs text-muted-foreground">
            {progression.levelXp} / {progression.levelSpan} XP
          </p>
        </div>
        <div className="mt-2.5">
          <Meter value={progression.progress} />
        </div>
        <p className="mt-2 text-[0.7rem] text-muted-foreground">
          {progression.nextRank
            ? `${progression.xpToNext} XP to level ${progression.level + 1} — ${progression.nextRank} unlocks at higher levels`
            : `${progression.xpToNext} XP to level ${progression.level + 1} — highest rank held`}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatTile label="Discipline" value={`${disciplineScore}`} tone="primary" />
        <StatTile label="Habits" value={`${habits.length}`} />
        <StatTile
          label="Badges"
          value={`${achievements.filter((a) => a.unlocked).length}`}
          tone="warning"
        />
      </div>


      <SectionHeader title="Recent badges" className="mt-6" />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {achievements
          .filter((a) => a.unlocked)
          .map((a) => (
            <div key={a.id} className="card-surface min-w-[8.5rem] px-3 py-3">
              <Award className="size-4 text-warning" strokeWidth={1.75} />
              <p className="mt-2 text-xs text-foreground">{a.name}</p>
            </div>
          ))}
      </div>

      <SectionHeader title="Manage" className="mt-6" />
      <ul className="card-surface divide-y divide-border overflow-hidden">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="flex items-center justify-between px-4 py-3.5 text-sm text-foreground"
            >
              {l.label}
              <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.75} />
            </Link>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={async () => {
          await signOut();
          void navigate({ to: "/", replace: true });
        }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <LogOut className="size-4" strokeWidth={1.75} />
        Sign out
      </button>
    </AppShell>
  );
}
