import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, RotateCcw, ShieldBan } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/aroha/app-shell";
import { PageHeading, StatTile } from "@/components/aroha/primitives";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAroha } from "@/context/aroha";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/focus")({
  head: () => ({
    meta: [
      { title: "Focus — AROHA" },
      {
        name: "description",
        content: "Pomodoro timer, stopwatch and deep work mode to eliminate distractions.",
      },
      { property: "og:title", content: "Focus — AROHA" },
      { property: "og:description", content: "Deep work, measured in sessions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FocusPage,
});

const presets = [
  { key: "focus", label: "Focus", minutes: 25 },
  { key: "short", label: "Short Break", minutes: 5 },
  { key: "long", label: "Long Break", minutes: 15 },
] as const;

function FocusPage() {
  const { logFocus, focusMinutes, sessions } = useAroha();
  const { profile, updatePreference } = useAuth();
  const [mode, setMode] = useState<"pomodoro" | "stopwatch">("pomodoro");
  const [preset, setPreset] = useState<(typeof presets)[number]>(presets[0]);
  const [remaining, setRemaining] = useState(presets[0].minutes * 60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const deepWork = profile?.focus_mode_enabled ?? false;
  const logged = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  async function setDeepWork(value: boolean) {
    try {
      await updatePreference("focus_mode_enabled", value);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save preference");
    }
  }

  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const initialElapsed = elapsed;
    const initialRemaining = remaining;
    const id = setInterval(() => {
      const seconds = Math.floor((Date.now() - started) / 1000);
      if (mode === "stopwatch") {
        setElapsed(initialElapsed + seconds);
      } else {
        setRemaining(Math.max(0, initialRemaining - seconds));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode]);

  async function saveSession() {
    setSaving(true);
    setSaveFailed(false);
    try {
      await logFocus(preset.minutes);
      toast.success("Focus complete — session saved");
    } catch { setSaveFailed(true); }
    finally { setSaving(false); }
  }

  useEffect(() => {
    if (mode === "pomodoro" && remaining === 0 && running && !logged.current) {
      logged.current = true;
      setRunning(false);
      if (preset.key === "focus") void saveSession();
      else toast.success(`${preset.label} complete`);
    }
  }, [remaining, running, mode, preset, logFocus]);

  function selectPreset(next: (typeof presets)[number]) {
    setPreset(next);
    setRemaining(next.minutes * 60);
    setRunning(false);
    logged.current = false;
  }

  function reset() {
    setRunning(false);
    logged.current = false;
    setSaveFailed(false);
    if (mode === "stopwatch") setElapsed(0);
    else setRemaining(preset.minutes * 60);
  }

  const total = preset.minutes * 60;
  const value = mode === "pomodoro" ? remaining : elapsed;
  const progress = mode === "pomodoro" ? 1 - remaining / total : (elapsed % 3600) / 3600;
  const mm = String(Math.floor(value / 60)).padStart(2, "0");
  const ss = String(value % 60).padStart(2, "0");

  const size = 250;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <AppShell title="Focus">
      <PageHeading title="Deep Work" subtitle="Eliminate distractions. One block at a time." />

      <div className="mb-6 flex gap-1.5 rounded-2xl border border-border bg-surface p-1">
        {(["pomodoro", "stopwatch"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setRunning(false);
            }}
            className={cn(
              "flex-1 rounded-xl py-2 text-xs capitalize transition-colors",
              mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid place-items-center">
        <div className="relative grid place-items-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c - progress * c}
              style={{ transition: "stroke-dashoffset 400ms linear" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="num text-5xl text-foreground">
              {mm}:{ss}
            </span>
            <span className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {mode === "pomodoro" ? preset.label : "Elapsed"}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Session <span className="num text-foreground">{sessions + 1}</span> / 4
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={reset}
          aria-label="Reset"
          className="grid size-11 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-4.5" strokeWidth={1.75} />
        </button>
        <button
          disabled={saving}
          onClick={() => { if (mode === "pomodoro" && remaining === 0) reset(); setRunning((r2) => !r2); }}
          className="flex items-center gap-2 rounded-2xl bg-primary px-10 py-3.5 text-sm font-medium text-primary-foreground shadow-[var(--glow-primary)] transition-transform active:scale-[0.98]"
        >
          {running ? <Pause className="size-4.5" strokeWidth={2} /> : <Play className="size-4.5" strokeWidth={2} />}
          {running ? "Pause" : "Start"}
        </button>
      </div>

      {saving && <p className="mt-3 text-center text-sm text-muted-foreground">Saving session…</p>}
      {saveFailed && <Button variant="outline" className="mx-auto mt-3 flex" onClick={() => void saveSession()}>Retry saving session</Button>}

      {mode === "pomodoro" ? (
        <div className="mt-6 flex gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => selectPreset(p)}
              className={cn(
                "flex-1 rounded-2xl border px-2 py-2.5 text-xs transition-colors",
                preset.key === p.key
                  ? "border-primary bg-primary-soft text-foreground"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              {p.label}
              <span className="num mt-0.5 block text-[0.7rem]">{p.minutes}m</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="card-surface mt-4 flex items-center gap-3 px-4 py-3.5">
        <ShieldBan className="size-4.5 text-primary" strokeWidth={1.75} />
        <div className="flex-1">
          <p className="text-sm text-foreground">Deep Work Mode</p>
          <p className="text-xs text-muted-foreground">Silence alerts and block distractions</p>
        </div>
        <Switch checked={deepWork} onCheckedChange={setDeepWork} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatTile label="Today" value={`${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m`} tone="primary" />
        <StatTile label="Sessions" value={`${sessions}`} />
        <StatTile label="Avg block" value={`${sessions ? Math.round(focusMinutes / sessions) : 0}`} suffix="m" tone="success" />
      </div>
    </AppShell>
  );
}
