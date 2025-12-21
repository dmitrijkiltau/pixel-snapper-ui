import type { ReactNode } from "react";
import type { ProgressStepKey, ProgressStepState, ProgressTone } from "./types";
import { cx, SectionHeader } from "./shared";

const progressStatusClasses: Record<ProgressTone, string> = {
  info: "border-slate-200 bg-white/80 text-slate-600",
  active: "border-slate-900 bg-slate-900 text-white",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const progressStepClasses: Record<ProgressStepState, string> = {
  idle: "border-slate-200 bg-white/70 text-slate-500",
  active:
    "border-slate-900 bg-slate-900 text-white shadow-[0_12px_30px_-20px_rgba(15,23,42,0.85)]",
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const progressStepMeta: Array<{
  key: ProgressStepKey;
  label: string;
  icon: ReactNode;
}> = [
  {
    key: "upload",
    label: "Upload",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M12 16V6" />
        <path d="M8 10l4-4 4 4" />
        <path d="M4 18h16" />
      </svg>
    ),
  },
  {
    key: "queue",
    label: "Queue",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M4 7h16" />
        <path d="M4 12h10" />
        <path d="M4 17h6" />
      </svg>
    ),
  },
  {
    key: "snap",
    label: "Snap",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <rect x="4" y="4" width="6" height="6" />
        <rect x="14" y="4" width="6" height="6" />
        <rect x="4" y="14" width="6" height="6" />
        <rect x="14" y="14" width="6" height="6" />
      </svg>
    ),
  },
  {
    key: "ready",
    label: "Ready",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

type ProgressStepProps = {
  stepKey: ProgressStepKey;
  label: string;
  icon: ReactNode;
  state: ProgressStepState;
};

const ProgressStep = ({ stepKey, label, icon, state }: ProgressStepProps) => (
  <div
    id={`progress-step-${stepKey}`}
    className={cx(
      "flex items-center gap-4 rounded-2xl border px-4 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition",
      progressStepClasses[state]
    )}
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-current/20 bg-current/10">
      {icon}
    </div>
    <span>{label}</span>
  </div>
);

type ProgressSectionProps = {
  label: string;
  tone: ProgressTone;
  steps: Record<ProgressStepKey, ProgressStepState>;
};

const ProgressSection = ({ label, tone, steps }: ProgressSectionProps) => (
  <section className="panel-card flex flex-col gap-4 reveal" style={{ animationDelay: "140ms" }}>
    <SectionHeader
      title="Progress"
      subtitle="A quick pulse while the snap runs."
      action={(
        <span
          id="progress-status"
          className={cx(
            "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
            progressStatusClasses[tone]
          )}
          aria-live="polite"
        >
          {label}
        </span>
      )}
    />

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {progressStepMeta.map((step) => (
        <ProgressStep
          key={step.key}
          stepKey={step.key}
          label={step.label}
          icon={step.icon}
          state={steps[step.key]}
        />
      ))}
    </div>
  </section>
);

export default ProgressSection;
