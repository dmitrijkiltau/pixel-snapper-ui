import type { ChangeEvent, FormEvent } from "react";
import { cx, SectionHeader, StepPill } from "./shared";

type UploadFormProps = {
  isLoading: boolean;
  uploadFileName: string;
  uploadPreviewUrl: string | null;
  uploadPreviewAlt: string;
  kColorsValue: string;
  kSeedValue: string;
  statusClassName: string;
  statusMessage: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKColorsChange: (value: string) => void;
  onKSeedChange: (value: string) => void;
};

const UploadForm = ({
  isLoading,
  uploadFileName,
  uploadPreviewUrl,
  uploadPreviewAlt,
  kColorsValue,
  kSeedValue,
  statusClassName,
  statusMessage,
  onSubmit,
  onFileChange,
  onKColorsChange,
  onKSeedChange,
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

    <label className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 px-5 py-6 text-sm transition hover:border-slate-500">
      <input
        id="image-input"
        type="file"
        name="image"
        accept="image/*"
        required
        className="sr-only"
        onChange={onFileChange}
      />
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">Image</span>
      <span className="text-base font-semibold text-slate-900">Drop a file or click to browse</span>
      <span id="file-name" className="font-[var(--font-mono)] text-xs text-slate-500">
        {uploadFileName}
      </span>
      {uploadPreviewUrl ? (
        <img
          id="upload-preview"
          className="pixelated mt-3 max-h-[240px] w-full object-contain p-3"
          src={uploadPreviewUrl}
          alt={uploadPreviewAlt}
        />
      ) : null}
    </label>

    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
        <span>Palette size</span>
        <input
          type="number"
          name="k_colors"
          min="1"
          max="256"
          value={kColorsValue}
          onChange={(event) => onKColorsChange(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
        <span className="text-xs font-normal text-slate-500">1 to 256 colors.</span>
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
        <span>Seed</span>
        <input
          type="number"
          name="k_seed"
          min="0"
          value={kSeedValue}
          onChange={(event) => onKSeedChange(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
        <span className="text-xs font-normal text-slate-500">Keep results deterministic.</span>
      </label>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <button id="snap-button" type="submit" className="btn-primary" disabled={isLoading}>
        Snap pixels
      </button>
      <div
        id="busy"
        className={cx(
          "items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500",
          !isLoading && "hidden"
        )}
      >
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500"></span>
        Processing
      </div>
    </div>

    <div id="status" className={statusClassName} aria-live="polite">
      {statusMessage}
    </div>
  </form>
);

export default UploadForm;
