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
        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
        : "bg-white/70 text-slate-500 dark:bg-slate-900/70 dark:text-slate-300"
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
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 dark:text-slate-300">{subtitle}</p>}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);
