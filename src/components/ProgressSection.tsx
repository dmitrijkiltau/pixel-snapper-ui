import { Fragment, type ReactNode } from "react";
import type { ProgressStepKey, ProgressStepState, ProgressTone } from "./types";
import { cx, SectionHeader } from "./shared";

const progressStatusClasses: Record<ProgressTone, string> = {
  info:
    "border-slate-200 bg-white/80 text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300",
  active:
    "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  error:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200",
};

const progressStepClasses: Record<ProgressStepState, string> = {
  idle:
    "border-slate-200 bg-white/70 text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300",
  active:
    "border-slate-900 bg-slate-900 text-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.9)] dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:shadow-[0_16px_40px_-28px_rgba(8,15,30,0.8)]",
  complete:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  error:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200",
};

const progressBadgeClasses: Record<ProgressStepState, string> = {
  idle:
    "border-slate-200 bg-white/80 text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300",
  active:
    "border-white/20 bg-white/10 text-white dark:border-slate-200/60 dark:bg-slate-200/80 dark:text-slate-900",
  complete:
    "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/25 dark:text-emerald-200",
  error:
    "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/25 dark:text-rose-200",
};

const progressStateLabels: Record<ProgressStepState, string> = {
  idle: "Waiting",
  active: "In progress",
  complete: "Done",
  error: "Needs fix",
};

const progressConnectorToneClasses: Record<ProgressStepState, string> = {
  idle: "bg-slate-300/70 dark:bg-slate-700/70",
  active: "bg-slate-900/80 dark:bg-slate-100/80",
  complete: "bg-emerald-400 dark:bg-emerald-400",
  error: "bg-rose-400 dark:bg-rose-400",
};

const progressConnectorScaleClasses: Record<
  ProgressStepState,
  { vertical: string; horizontal: string }
> = {
  idle: { vertical: "scale-y-0", horizontal: "scale-x-0" },
  active: { vertical: "scale-y-[0.65]", horizontal: "scale-x-[0.65]" },
  complete: { vertical: "scale-y-[1]", horizontal: "scale-x-[1]" },
  error: { vertical: "scale-y-[1]", horizontal: "scale-x-[1]" },
};

const progressFallbackDetails: Record<ProgressStepKey, string> = {
  upload: "Choose an image to begin.",
  queue: "Preparing the snap pipeline.",
  snap: "Snapping pixels into a tighter palette.",
  ready: "Finalizing the download.",
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
  detail: string;
};

const ProgressStep = ({ stepKey, label, icon, state, detail }: ProgressStepProps) => (
  <div
    id={`progress-step-${stepKey}`}
    aria-current={state === "active" ? "step" : undefined}
    className={cx(
      "group flex h-full flex-1 flex-col justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.7)]",
      progressStepClasses[state]
    )}
  >
    <div className="flex items-start gap-3">
      <div
        className={cx(
          "flex h-11 w-11 items-center justify-center",
          state === "active" && "motion-safe:animate-pulse"
        )}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-current opacity-70">
          {label}
        </span>
        <p className="text-sm font-semibold leading-snug text-current">{detail}</p>
      </div>
    </div>
    <span
      className={cx(
        "self-start rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em]",
        progressBadgeClasses[state]
      )}
    >
      {progressStateLabels[state]}
    </span>
  </div>
);

type ProgressConnectorProps = {
  state: ProgressStepState;
};

const ProgressConnector = ({ state }: ProgressConnectorProps) => (
  <div aria-hidden="true" className="flex items-center justify-center self-center">
    <div className="relative h-6 w-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 lg:hidden">
      <div
        className={cx(
          "absolute inset-0 rounded-full origin-top transition-transform duration-700",
          progressConnectorToneClasses[state],
          progressConnectorScaleClasses[state].vertical,
          state === "active" && "motion-safe:animate-pulse"
        )}
      />
    </div>
    <div className="relative hidden h-1 w-12 rounded-full bg-slate-200/80 dark:bg-slate-800/80 lg:block">
      <div
        className={cx(
          "absolute inset-0 rounded-full origin-left transition-transform duration-700",
          progressConnectorToneClasses[state],
          progressConnectorScaleClasses[state].horizontal,
          state === "active" && "motion-safe:animate-pulse"
        )}
      />
    </div>
  </div>
);

type ProgressSectionProps = {
  label: string;
  tone: ProgressTone;
  steps: Record<ProgressStepKey, ProgressStepState>;
  details?: Partial<Record<ProgressStepKey, string>>;
};

const ProgressSection = ({ label, tone, steps, details = {} }: ProgressSectionProps) => (
  <section className="panel-card flex flex-col gap-4 reveal" style={{ animationDelay: "140ms" }}>
    <SectionHeader
      title="Progress"
      subtitle="A live timeline while the snap runs."
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

    <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-3">
      {progressStepMeta.map((step, index) => {
        const state = steps[step.key];
        const detail = details[step.key] ?? progressFallbackDetails[step.key];

        return (
          <Fragment key={step.key}>
            <ProgressStep
              stepKey={step.key}
              label={step.label}
              icon={step.icon}
              state={state}
              detail={detail}
            />
            {index < progressStepMeta.length - 1 ? (
              <ProgressConnector state={state} />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  </section>
);

export default ProgressSection;
