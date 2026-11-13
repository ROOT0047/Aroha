import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import type { ScheduleTemplate, TemplateBlock } from "@/data/templates";

export type CustomTemplate = ScheduleTemplate & { custom: true };

const KEY = ["schedule-templates"];
const TIME = /^\d{2}:\d{2}$/;

function sanitizeBlocks(raw: unknown): TemplateBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b): b is Record<string, unknown> => !!b && typeof b === "object")
    .map((b) => ({
      title: String(b["title"] ?? "").slice(0, 60),
      description: String(b["description"] ?? ""),
      startTime: String(b["startTime"] ?? "09:00").slice(0, 5),
      endTime: String(b["endTime"] ?? "10:00").slice(0, 5),
      priority: (["High", "Medium", "Low"].includes(String(b["priority"]))
        ? b["priority"]
        : "Medium") as TemplateBlock["priority"],
      color: (typeof b["color"] === "string" ? b["color"] : "primary") as TemplateBlock["color"],
    }))
    .filter((b) => b.title && TIME.test(b.startTime) && TIME.test(b.endTime));
}

export function useCustomTemplates() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<CustomTemplate[]> => {
      const { data, error } = await supabase
        .from("schedule_templates")
        .select("id, name, tagline, blocks")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        tagline: t.tagline,
        blocks: sanitizeBlocks(t.blocks),
        custom: true as const,
      }));
    },
  });

  const save = useMutation({
    mutationFn: async (t: { id?: string; name: string; tagline: string; blocks: TemplateBlock[] }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sign in to save templates");
      const row = { name: t.name, tagline: t.tagline, blocks: t.blocks as never };
      const { error } = t.id
        ? await supabase.from("schedule_templates").update(row).eq("id", t.id)
        : await supabase.from("schedule_templates").insert({ ...row, user_id: u.user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });

  return { templates: query.data ?? [], save, remove };
}

const blank = (): TemplateBlock => ({
  title: "",
  description: "",
  startTime: "09:00",
  endTime: "10:00",
  priority: "Medium",
  color: "primary",
});

export function TemplateEditorSheet({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: { id?: string; name: string; tagline: string; blocks: TemplateBlock[] } | null;
  onSave: (t: { id?: string; name: string; tagline: string; blocks: TemplateBlock[] }) => void;
}) {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [blocks, setBlocks] = useState<TemplateBlock[]>([blank()]);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setTagline(initial?.tagline ?? "");
    setBlocks(initial?.blocks.length ? initial.blocks : [blank()]);
  }, [open, initial]);

  function update(i: number, patch: Partial<TemplateBlock>) {
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  function submit() {
    const clean = blocks
      .map((b) => ({ ...b, title: b.title.trim() }))
      .filter((b) => b.title);
    if (!name.trim()) {
      toast.error("Give the template a name");
      return;
    }
    if (!clean.length) {
      toast.error("Add at least one block with a title");
      return;
    }
    if (clean.some((b) => b.startTime >= b.endTime)) {
      toast.error("Each block must end after it starts");
      return;
    }
    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      name: name.trim().slice(0, 60),
      tagline: tagline.trim().slice(0, 120),
      blocks: clean.sort((a, b) => a.startTime.localeCompare(b.startTime)),
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[90vh] max-w-md overflow-y-auto rounded-t-3xl border-border bg-surface"
      >
        <SheetHeader>
          <SheetTitle>{initial?.id ? "Edit template" : "New template"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">Name</Label>
            <Input id="tpl-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="My weekday" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-tagline">Short description</Label>
            <Input id="tpl-tagline" value={tagline} maxLength={120} onChange={(e) => setTagline(e.target.value)} placeholder="Early start, deep work, gym" />
          </div>
          <div className="space-y-2">
            <Label>Blocks</Label>
            {blocks.map((b, i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-border bg-background p-3">
                <div className="flex gap-2">
                  <Input
                    aria-label={`Block ${i + 1} title`}
                    value={b.title}
                    maxLength={60}
                    onChange={(e) => update(i, { title: e.target.value })}
                    placeholder="Block title"
                  />
                  <button
                    type="button"
                    aria-label={`Remove block ${i + 1}`}
                    onClick={() => setBlocks((prev) => prev.filter((_, idx) => idx !== i))}
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="time" aria-label="Start" value={b.startTime} onChange={(e) => update(i, { startTime: e.target.value })} />
                  <Input type="time" aria-label="End" value={b.endTime} onChange={(e) => update(i, { endTime: e.target.value })} />
                  <select
                    aria-label="Priority"
                    value={b.priority}
                    onChange={(e) => update(i, { priority: e.target.value as TemplateBlock["priority"] })}
                    className="h-9 rounded-md border border-input bg-transparent px-2 text-sm text-foreground"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                const last = blocks[blocks.length - 1];
                setBlocks((prev) => [...prev, { ...blank(), startTime: last?.endTime ?? "09:00", endTime: last?.endTime ?? "10:00" }]);
              }}
            >
              <Plus className="size-4" /> Add block
            </Button>
          </div>
        </div>
        <SheetFooter>
          <Button onClick={submit} className="w-full">
            Save template
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
