import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/aroha/app-shell";
import { PageHeading } from "@/components/aroha/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAroha } from "@/context/aroha";
import type { JournalEntry } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — AROHA" },
      {
        name: "description",
        content: "Daily reflection with mood tracking and a private, distraction-free writing surface.",
      },
      { property: "og:title", content: "Journal — AROHA" },
      { property: "og:description", content: "Write the day down. Patterns surface later." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JournalPage,
});

const moods: JournalEntry["mood"][] = ["Focused", "Calm", "Tired", "Driven"];

function JournalPage() {
  const { journal, addJournal } = useAroha();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState<JournalEntry["mood"]>("Focused");
  const [content, setContent] = useState("");

  function submit() {
    if (!title.trim() || !content.trim()) {
      toast.error("Add a title and some words");
      return;
    }
    addJournal({ title: title.trim(), mood, content: content.trim() });
    toast.success("Entry saved");
    setTitle("");
    setContent("");
    setOpen(false);
  }

  return (
    <AppShell title="Journal">
      <PageHeading title="Reflection" subtitle={`${journal.length} entries`} />

      <ul className="space-y-3">
        {journal.map((entry) => (
          <li key={entry.id} className="card-surface px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm text-foreground">{entry.title}</p>
              <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-0.5 text-[0.65rem] text-primary">
                {entry.mood}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{entry.content}</p>
            <p className="num mt-3 text-[0.68rem] text-muted-foreground">{entry.createdAt}</p>
          </li>
        ))}
      </ul>

      <Button onClick={() => setOpen(true)} className="mt-5 w-full gap-2">
        <Plus className="size-4" strokeWidth={2} />
        New entry
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl border-border bg-surface">
          <SheetHeader>
            <SheetTitle>New entry</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="j-title">Title</Label>
              <Input
                id="j-title"
                value={title}
                maxLength={80}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Held the line"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-sm text-foreground">Mood</span>
              <div className="flex gap-2">
                {moods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={cn(
                      "flex-1 rounded-xl border py-1.5 text-xs transition-colors",
                      mood === m
                        ? "border-primary bg-primary-soft text-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="j-content">Entry</Label>
              <Textarea
                id="j-content"
                rows={5}
                maxLength={2000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What decided today?"
              />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={submit} className="w-full">
              Save entry
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
