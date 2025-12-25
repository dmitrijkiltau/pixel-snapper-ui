import type { ChangeEvent, FormEvent } from "react";
import Icon from "./Icon";
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

    <label className="dropzone group">
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

    <div className="info-box">
      <Icon name="info-circle" className="h-3.5 w-3.5 shrink-0" />
      <em>AI pixel outputs snap best when they are slightly oversized.</em>
    </div>

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
          className="input-field"
        />
        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">1 to 256 colors.</span>
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        <span>Seed (0 = random)</span>
        <input
          type="number"
          name="k_seed"
          min="0"
          value={kSeedValue}
          onChange={(event) => onKSeedChange(event.target.value)}
          className="input-field"
        />
        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
          Enter a number to reproduce results, or keep 0 to reroll each snap.
        </span>
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
        className="btn-secondary"
      >
        Edit without snapping
      </button>
    </div>

  </form>
);

export default UploadForm;
