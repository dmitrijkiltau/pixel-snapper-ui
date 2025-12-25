import { type ReactNode, useEffect, useRef, useState } from "react";
import type { ProgressStepKey, ProgressStepState } from "./types";
import { cx } from "./shared";
import Icon from "./Icon";

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

const completeStepIcon = <Icon name="gallery-check" className="h-4 w-4" />;

const progressStepMeta: Array<{
  key: ProgressStepKey;
  label: string;
  icon: ReactNode;
  completeIcon: ReactNode;
}> = [
  {
    key: "upload",
    label: "Upload",
    icon: <Icon name="gallery-add" className="h-4 w-4" />,
    completeIcon: completeStepIcon,
  },
  {
    key: "queue",
    label: "Queue",
    icon: <Icon name="gallery-wide" className="h-4 w-4" />,
    completeIcon: completeStepIcon,
  },
  {
    key: "snap",
    label: "Snap",
    icon: <Icon name="code-scan" className="h-4 w-4" />,
    completeIcon: completeStepIcon,
  },
  {
    key: "ready",
    label: "Ready",
    icon: completeStepIcon,
    completeIcon: completeStepIcon,
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
    <div className={cx("flex flex-col", !isLast && "flex-1")}>
      <div className="flex w-full items-center">
        <div
          className={cx(
            "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
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

        {!isLast && (
          <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className={cx(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
                state === "complete" || nextState === "active" || nextState === "complete"
                  ? "w-full bg-emerald-500 dark:bg-emerald-400"
                  : "w-0 bg-slate-400"
              )}
            />
          </div>
        )}
      </div>
      <div className="mt-2 flex w-9 justify-center">
        <span className={cx(
          "text-xs transition-colors duration-300 whitespace-nowrap",
          stepLabelClasses[state],
        )}>
          {step.label}
        </span>
      </div>
    </div>
  );
};

type ProgressSectionProps = {
  steps: Record<ProgressStepKey, ProgressStepState>;
};

const ProgressSection = ({ steps }: ProgressSectionProps) => {
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(!entry.isIntersecting);
      },
      { threshold: 1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Sentinel element to detect when sticky element becomes stuck */}
      <div ref={sentinelRef} className="h-px -mb-px -mt-10" aria-hidden="true" />
      
      <section 
        ref={sectionRef}
        className={cx(
          "sticky top-0 z-20 panel-card transition-all duration-300 reveal",
          isStuck && "rounded-t-none border-x-0 border-t-0 pt-2 pb-3 shadow-xl bg-surface/95 backdrop-blur-md"
        )}
        style={{ animationDelay: "140ms" }}
      >
        {/* Sticky step indicators */}
        <div className={cx(
          "flex items-start justify-between gap-1 px-1 transition-all duration-300",
          isStuck ? "py-0" : "py-4"
        )}>
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
    </>
  );
};

export default ProgressSection;
