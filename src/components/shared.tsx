import type { ReactNode } from "react";

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

type TagPillProps = {
  label: string;
};

export const TagPill = ({ label }: TagPillProps) => (
  <span className="tag-pill">{label}</span>
);

type StepPillTone = "light" | "dark";

type StepPillProps = {
  label: string;
  tone?: StepPillTone;
};

export const StepPill = ({ label, tone = "light" }: StepPillProps) => (
  <span
    className={cx(
      "step-pill",
      tone === "dark"
        ? "bg-ink text-paper"
        : "bg-paper/70 text-muted"
    )}
  >
    {label}
  </span>
);

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export const SectionHeader = ({ title, subtitle, action }: SectionHeaderProps) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export const EmptyState = ({ icon, title, description }: EmptyStateProps) => (
  <div className="empty-state w-full flex-1 bg-linear-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50">
    <div className="empty-state-icon">
      {icon}
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  </div>
);
