import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function ScoreRing({
  value,
  size = 168,
  label = "Discipline",
  caption,
}: {
  value: number;
  size?: number;
  label?: string;
  caption?: string;
}) {
  const stroke = size > 120 ? 12 : 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="num text-foreground" style={{ fontSize: size / 3.6, lineHeight: 1 }}>
          {value}
        </span>
        <span className="num mt-1 text-[0.65rem] text-muted-foreground">/100</span>
        {caption ? (
          <span className="mt-1 text-xs font-medium text-primary">{caption}</span>
        ) : (
          <span className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  suffix,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: "default" | "primary" | "success" | "warning";
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  const toneClass = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
  }[tone];

  return (
    <div className="card-surface flex flex-col gap-1 px-3 py-3">
      <span className="flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">
        {Icon ? <Icon className="size-3.5" strokeWidth={1.75} /> : null}
        {label}
      </span>
      <span className={cn("num text-lg", toneClass)}>
        {value}
        {suffix ? <span className="ml-0.5 text-[0.7rem] text-muted-foreground">{suffix}</span> : null}
      </span>
    </div>
  );
}

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between", className)}>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  );
}

export function Meter({
  value,
  max,
  tone = "primary",
  className,
}: {
  value: number;
  max?: number;
  tone?: "primary" | "success" | "secondary" | "warning";
  className?: string;
}) {
  const bg = {
    primary: "bg-primary",
    success: "bg-success",
    secondary: "bg-secondary",
    warning: "bg-warning",
  }[tone];

  const pct = max ? (value / max) * 100 : value;

  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-border", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", bg)}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

export function PageHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="rise mb-5">
      <h1 className="text-2xl text-foreground">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
