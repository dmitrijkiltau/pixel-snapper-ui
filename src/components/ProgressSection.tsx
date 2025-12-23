import { type ReactNode } from "react";
import type { ProgressStepKey, ProgressStepState } from "./types";
import { cx } from "./shared";

const stepIconClasses: Record<ProgressStepState, string> = {
  idle: "border-border bg-surface text-muted",
  active: "border-ink bg-ink text-paper shadow-lg",
  complete: "border-success bg-success text-paper",
  error: "border-error bg-error text-paper",
};

const stepLabelClasses: Record<ProgressStepState, string> = {
  idle: "text-muted",
  active: "text-ink font-semibold",
  complete: "text-success",
  error: "text-error",
};

const progressStepMeta: Array<{
  key: ProgressStepKey;
  label: string;
  icon: ReactNode;
  completeIcon: ReactNode;
}> = [
    {
      key: "upload",
      label: "Upload",
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M12 16V6M8 10l4-4 4 4" />
        </svg>
      ),
      completeIcon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M5 12l5 5L20 7" />
        </svg>
      ),
    },
    {
      key: "queue",
      label: "Queue",
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M4 7h16M4 12h10M4 17h6" />
        </svg>
      ),
      completeIcon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M5 12l5 5L20 7" />
        </svg>
      ),
    },
    {
      key: "snap",
      label: "Snap",
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <rect x="5" y="5" width="5" height="5" /><rect x="14" y="5" width="5" height="5" /><rect x="5" y="14" width="5" height="5" /><rect x="14" y="14" width="5" height="5" />
        </svg>
      ),
      completeIcon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M5 12l5 5L20 7" />
        </svg>
      ),
    },
    {
      key: "ready",
      label: "Ready",
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M5 12l5 5L20 7" />
        </svg>
      ),
      completeIcon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M5 12l5 5L20 7" />
        </svg>
      ),
    },
  ];

type ProgressStepProps = {
  step: typeof progressStepMeta[number];
  state: ProgressStepState;
  isLast: boolean;
  nextState?: ProgressStepState;
};

const ProgressStep = ({ step, state, isLast, nextState }: ProgressStepProps) => {
  const isActive = state === "active";
  const isComplete = state === "complete";
  const showIcon = isComplete ? step.completeIcon : step.icon;

  return (
    <div className={cx("flex items-center", !isLast && "flex-1")}>
      <div className="flex flex-col items-center gap-2">
        <div
          className={cx(
            "relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300",
            stepIconClasses[state],
            isActive && "motion-safe:animate-pulse"
          )}
        >
          {showIcon}
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-2 border-slate-900/50 dark:border-slate-100/50 motion-safe:animate-ping"
            />
          )}
        </div>
        <span className={cx("text-xs transition-colors duration-300", stepLabelClasses[state])}>
          {step.label}
        </span>
      </div>

      {!isLast && (
        <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={cx(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
              state === "complete" || nextState === "active" || nextState === "complete"
                ? "w-full bg-emerald-500 dark:bg-emerald-400"
                : state === "active"
                  ? "w-1/2 bg-slate-900 dark:bg-slate-100"
                  : "w-0 bg-slate-400"
            )}
          />
        </div>
      )}
    </div>
  );
};

type ProgressSectionProps = {
  steps: Record<ProgressStepKey, ProgressStepState>;
};

const ProgressSection = ({ steps }: ProgressSectionProps) => {
  return (
    <section className="sticky top-0 z-20 panel-card mt-0 rounded-t-none border-t-0 pt-0 reveal" style={{ animationDelay: "140ms" }}>
      {/* Sticky step indicators */}
      <div className="flex items-start justify-between gap-1 px-1 py-4">
        {progressStepMeta.map((step, index) => {
          const state = steps[step.key];
          const nextStep = progressStepMeta[index + 1];
          const nextState = nextStep ? steps[nextStep.key] : undefined;

          return (
            <ProgressStep
              key={step.key}
              step={step}
              state={state}
              isLast={index === progressStepMeta.length - 1}
              nextState={nextState}
            />
          );
        })}
      </div>
    </section>
  );
};

export default ProgressSection;
