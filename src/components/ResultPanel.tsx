import type { PreviewScale } from "./types";
import { cx, SectionHeader, StepPill } from "./shared";

const previewScaleClasses = {
  active:
    "border-slate-900 bg-slate-900 text-white shadow-[0_8px_20px_-12px_rgba(15,23,42,0.8)] dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:shadow-[0_8px_20px_-12px_rgba(8,15,30,0.7)]",
  inactive:
    "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100",
};

const previewScaleOptions: PreviewScale[] = ["1", "2", "3"];

type PreviewScaleSelectorProps = {
  value: PreviewScale;
  onChange: (value: PreviewScale) => void;
};

const PreviewScaleSelector = ({ value, onChange }: PreviewScaleSelectorProps) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 p-1 dark:border-slate-700 dark:bg-slate-900/60">
    {previewScaleOptions.map((option) => {
      const isActive = value === option;
      return (
        <button
          key={option}
          type="button"
          data-preview-scale={option}
          onClick={() => onChange(option)}
          aria-pressed={isActive}
          className={cx(
            "rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em]",
            isActive ? previewScaleClasses.active : previewScaleClasses.inactive
          )}
        >
          {option}x
        </button>
      );
    })}
  </div>
);

type ResultPanelProps = {
  resultUrl: string | null;
  resultDownloadName: string;
  previewScale: PreviewScale;
  onPreviewScaleChange: (value: PreviewScale) => void;
};

const ResultPanel = ({
  resultUrl,
  resultDownloadName,
  previewScale,
  onPreviewScaleChange,
}: ResultPanelProps) => (
  <section className="panel-card flex flex-col gap-5 reveal" style={{ animationDelay: "220ms" }}>
    <SectionHeader
      title="Result"
      subtitle="PNG preview with crisp grid edges."
      action={<StepPill label="Step 2" />}
    />

    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-300">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-400">
        Preview scale
      </span>
      <PreviewScaleSelector value={previewScale} onChange={onPreviewScaleChange} />
    </div>

    <div className="flex flex-col gap-4">
      <div
        id="result"
        data-preview-scale={previewScale}
        className="flex min-h-[280px] flex-col items-center justify-center gap-2 text-center text-sm text-slate-500 dark:text-slate-300"
        aria-live="polite"
      >
        {resultUrl ? (
          <>
            <div className="preview-viewport w-full relative p-4 sm:p-6">
              <img src={resultUrl} alt="Snapped result" className="preview-image pixelated" />
            </div>
            <a
              href={resultUrl}
              download={resultDownloadName}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100"
            >
              Download {resultDownloadName}
            </a>
          </>
        ) : (
          <>
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-400">Awaiting</span>
            <p>Upload an image and hit Snap.</p>
          </>
        )}
      </div>
    </div>

    <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-xs text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300">
      Tip: AI pixel outputs snap best when they are slightly oversized.
    </div>
  </section>
);

export default ResultPanel;
