import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/aroha/app-shell";
import { useAroha } from "@/context/aroha";
import { askCoach } from "@/lib/api";
import { cn } from "@/lib/utils";
import logo from "@/assets/aroha-mark.png";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "AROHA AI — Your Discipline Coach" },
      {
        name: "description",
        content: "A calm, analytical AI coach that reviews your day, finds patterns and sets tomorrow's priorities.",
      },
      { property: "og:title", content: "AROHA AI — Your Discipline Coach" },
      { property: "og:description", content: "Daily briefings, pattern analysis, honest feedback." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoachPage,
});

function CoachPage() {
  const { coach, addCoachMessage, refreshCoach } = useAroha();
  const ask = askCoach;
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [coach, thinking]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;
    addCoachMessage({ id: Math.random().toString(36).slice(2), role: "user", content: text });
    setInput("");
    setThinking(true);
    try {
      await ask({ data: { message: text } });
      await refreshCoach();
    } catch (error) {
      console.error(error);
      toast.error("AROHA AI couldn't reply. Try again in a moment.");
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  }

  return (
    <AppShell title="AROHA AI">
      <div className="mb-5 flex items-center gap-3">
        <img src={logo} alt="" className="size-10 rounded-xl" />
        <div>
          <h1 className="text-sm text-foreground">AROHA AI Coach</h1>
          <p className="text-xs text-muted-foreground">Analytical. Direct. Never flattering.</p>
        </div>
      </div>

      <div className="space-y-3">
        {coach.length === 0 && !thinking ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ask about today's plan, a habit you keep missing, or how to structure tomorrow.
          </p>
        ) : null}
        {coach.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <p
              className={cn(
                "max-w-[85%] text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground"
                  : "rounded-2xl border border-border bg-surface px-4 py-3 text-foreground",
              )}
            >
              {m.content}
            </p>
          </div>
        ))}
        {thinking ? (
          <p className="text-xs text-muted-foreground">AROHA AI is analysing…</p>
        ) : null}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => void send(e)}
        className="sticky bottom-2 mt-5 flex items-center gap-2 rounded-2xl border border-border bg-surface p-1.5"
      >
        <input
          ref={inputRef}
          value={input}
          maxLength={500}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about today's plan…"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!input.trim() || thinking}
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
        >
          <Send className="size-4" strokeWidth={2} />
        </button>
      </form>
    </AppShell>
  );
}
