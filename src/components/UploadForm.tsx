import type { ChangeEvent, FormEvent } from "react";
import { cx, SectionHeader, StepPill } from "./shared";

type UploadFormProps = {
  isLoading: boolean;
  canEditInput: boolean;
  uploadFileName: string;
  uploadPreviewUrl: string | null;
  uploadPreviewAlt: string;
  kColorsValue: string;
  kSeedValue: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKColorsChange: (value: string) => void;
  onKSeedChange: (value: string) => void;
  onEditInput: () => void;
};

const UploadForm = ({
  isLoading,
  canEditInput,
  uploadFileName,
  uploadPreviewUrl,
  uploadPreviewAlt,
  kColorsValue,
  kSeedValue,
  onSubmit,
  onFileChange,
  onKColorsChange,
  onKSeedChange,
  onEditInput,
}: UploadFormProps) => (
  <form
    id="snap-form"
    className={cx(
      "panel-card flex flex-col gap-6 reveal",
      isLoading && "opacity-60"
    )}
    style={{ animationDelay: "140ms" }}
    aria-busy={isLoading ? "true" : "false"}
    onSubmit={onSubmit}
  >
    <SectionHeader
      title="Upload + tune"
      subtitle="Drop your art and dial in the palette."
      action={<StepPill tone="dark" label="Step 1" />}
    />

    <label className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 px-5 py-6 text-sm transition hover:border-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-slate-500">
      <input
        id="image-input"
        type="file"
        name="image"
        accept="image/*"
        required
        className="sr-only"
        onChange={onFileChange}
      />
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Image</span>
      <span className="text-base font-semibold text-slate-900 dark:text-slate-100">Drop a file or click to browse</span>
      <span id="file-name" className="font-mono text-xs text-slate-500 dark:text-slate-400">
        {uploadFileName}
      </span>
      {uploadPreviewUrl ? (
        <img
          id="upload-preview"
          className="pixelated mt-3 max-h-60 w-full object-contain p-3"
          src={uploadPreviewUrl}
          alt={uploadPreviewAlt}
        />
      ) : null}
    </label>

    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        <span>Palette size</span>
        <input
          type="number"
          name="k_colors"
          min="1"
          max="256"
          value={kColorsValue}
          onChange={(event) => onKColorsChange(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-slate-200 dark:focus:ring-slate-200/20"
        />
        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">1 to 256 colors.</span>
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        <span>Seed</span>
        <input
          type="number"
          name="k_seed"
          min="0"
          value={kSeedValue}
          onChange={(event) => onKSeedChange(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-slate-200 dark:focus:ring-slate-200/20"
        />
        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Keep results deterministic.</span>
      </label>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <button id="snap-button" type="submit" className="btn-primary" disabled={isLoading}>
        Snap pixels
      </button>
      <button
        type="button"
        onClick={onEditInput}
        disabled={isLoading || !canEditInput}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200/70 disabled:bg-white/50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100 dark:disabled:border-slate-700/70 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-500"
      >
        Edit without snapping
      </button>
    </div>

  </form>
);

export default UploadForm;
