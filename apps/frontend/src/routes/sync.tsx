import { createFileRoute } from "@tanstack/react-router";
import { CloudCog, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/aroha/app-shell";
import { PageHeading, SectionHeader } from "@/components/aroha/primitives";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sync")({
  head: () => ({
    meta: [
      { title: "Sync & Backup — AROHA" },
      { name: "description", content: "Offline-first storage with cloud sync, export and restore for your data." },
      { property: "og:title", content: "Sync & Backup — AROHA" },
      { property: "og:description", content: "Offline-first, with cloud sync and export." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SyncPage,
});

function SyncPage() {
  return (
    <AppShell title="Sync">
      <PageHeading title="Sync & backup" subtitle="Offline-first. Cloud when connected." />

      <section className="card-surface px-4 py-4">
        <div className="flex items-center gap-3">
          <CloudCog className="size-5 text-primary" strokeWidth={1.75} />
          <div>
            <p className="text-sm text-foreground">Last sync</p>
            <p className="num text-xs text-muted-foreground">Today at 06:12</p>
          </div>
        </div>
        <Button className="mt-4 w-full gap-2" onClick={() => toast.success("Everything is up to date")}>
          <RefreshCw className="size-4" strokeWidth={1.75} />
          Sync now
        </Button>
      </section>

      <SectionHeader title="Your data" className="mt-6" />
      <div className="space-y-2.5">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => toast.success("Export prepared")}
        >
          <Download className="size-4" strokeWidth={1.75} />
          Export as JSON
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => toast.success("Backup restored from cloud")}
        >
          Restore from backup
        </Button>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        This prototype keeps data in memory only. Connecting a backend adds real accounts,
        cloud sync and cross-device restore.
      </p>
    </AppShell>
  );
}
