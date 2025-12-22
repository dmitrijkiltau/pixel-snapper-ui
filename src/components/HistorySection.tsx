import { useRef, useState } from "react";
import type { HistoryItem, PreviewBackgroundOption } from "./types";
import { cx, SectionHeader, StepPill, TagPill } from "./shared";

const formatTimestamp = (value: number) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString();
};

type HistoryCardProps = {
  item: HistoryItem;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (item: HistoryItem) => void;
  previewBackground: PreviewBackgroundOption;
};

const HistoryCard = ({
  item,
  isActive,
  onSelect,
  onDelete,
  previewBackground,
}: HistoryCardProps) => {
  const timestamp = formatTimestamp(item.createdAt);
  const paletteLabel =
    typeof item.kColors === "number" && Number.isFinite(item.kColors)
      ? `${item.kColors} colors`
      : null;
  const dimensionsLabel =
    typeof item.width === "number" &&
    typeof item.height === "number" &&
    Number.isFinite(item.width) &&
    Number.isFinite(item.height)
      ? `${item.width}x${item.height} px`
      : null;
  const seedLabel =
    typeof item.kSeed === "number" && Number.isFinite(item.kSeed)
      ? String(item.kSeed)
      : null;
  const imageBackgroundClass = previewBackground === "dark" ? "bg-slate-900/60" : "bg-white/90";

  return (
    <details
      className={cx(
        "flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60",
        isActive && "ring-2 ring-slate-900/15 dark:ring-slate-100/25"
      )}
    >
      <summary className="details-summary flex cursor-pointer flex-col gap-3">
        <img
          src={item.dataUrl}
          alt={item.sourceName ? `Result from ${item.sourceName}` : "Result image"}
          loading="lazy"
          className={cx(
            "pixelated h-36 w-full rounded-xl border border-slate-200 object-contain p-3",
            "dark:border-slate-700",
            imageBackgroundClass
          )}
        />
        <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-300">
          <span className="font-semibold text-slate-700 dark:text-slate-100">
            {item.downloadName || item.sourceName || "Result image"}
          </span>
          {timestamp || paletteLabel ? (
            <div className="flex items-center justify-between gap-2">
              <span>{timestamp}</span>
              {paletteLabel ? <TagPill label={paletteLabel} /> : null}
            </div>
          ) : null}
        </div>
      </summary>
      <div className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-300">
        {dimensionsLabel ? <span>Dimensions: {dimensionsLabel}</span> : null}
        {paletteLabel ? <span>Palette: {paletteLabel}</span> : null}
        {seedLabel ? <span>Seed: {seedLabel}</span> : null}
        {item.sourceName ? <span>Source: {item.sourceName}</span> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100"
        >
          Edit in panel
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 shadow-sm transition hover:border-rose-300 hover:text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:border-rose-300/70"
        >
          Delete
        </button>
        <a
          href={item.dataUrl}
          download={item.downloadName || "snapped.png"}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100"
        >
          Download
        </a>
      </div>
    </details>
  );
};

const HistoryEmpty = () => (
  <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-400">No history yet</span>
    <p>Snapped images saved here for quick download.</p>
  </div>
);

type HistorySectionProps = {
  items: HistoryItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  previewBackground: PreviewBackgroundOption;
};

const HistorySection = ({
  items,
  activeId,
  onSelect,
  onClearHistory,
  onDeleteItem,
  previewBackground,
}: HistorySectionProps) => {
  const clearDialogRef = useRef<HTMLDialogElement | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HistoryItem | null>(null);
  const hasItems = items.length > 0;

  const openClearDialog = () => {
    if (!hasItems) {
      return;
    }
    const dialog = clearDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  };

  const closeClearDialog = () => {
    const dialog = clearDialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
  };

  const handleConfirmClear = () => {
    onClearHistory();
    closeClearDialog();
  };

  const openDeleteDialog = (item: HistoryItem) => {
    setDeleteTarget(item);
    const dialog = deleteDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  };

  const closeDeleteDialog = () => {
    const dialog = deleteDialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
    setDeleteTarget(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }
    onDeleteItem(deleteTarget.id);
    closeDeleteDialog();
  };

  return (
    <section className="panel-card flex flex-col gap-5 reveal" style={{ animationDelay: "260ms" }}>
      <SectionHeader
        title="History"
        subtitle="Saved locally for quick downloads."
        action={<StepPill label="Local" />}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-300">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-400">
          Saved outputs
        </span>
        <button
          type="button"
          onClick={openClearDialog}
          disabled={!hasItems}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:border-rose-200/70 disabled:bg-rose-50/50 disabled:text-rose-300 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:border-rose-300/70 dark:disabled:border-rose-400/30 dark:disabled:bg-rose-500/10 dark:disabled:text-rose-300/60"
        >
          Clear history
        </button>
      </div>

      <div id="history" className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {items.length === 0 ? (
            <HistoryEmpty />
          ) : (
            items.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                isActive={item.id === activeId}
                onSelect={onSelect}
                onDelete={openDeleteDialog}
                previewBackground={previewBackground}
              />
            ))
          )}
      </div>

      <dialog
        ref={clearDialogRef}
        className="dialog-shell"
        aria-labelledby="clear-history-title"
        aria-describedby="clear-history-description"
        onCancel={(event) => {
          event.preventDefault();
          closeClearDialog();
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <p
              id="clear-history-title"
              className="text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              Delete history?
            </p>
            <p
              id="clear-history-description"
              className="text-xs text-slate-500 dark:text-slate-300"
            >
              This removes all saved results from this browser.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeClearDialog}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmClear}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-rose-600 transition hover:border-rose-300 hover:text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:border-rose-300/70"
            >
              Delete history
            </button>
          </div>
        </div>
      </dialog>

      <dialog
        ref={deleteDialogRef}
        className="dialog-shell"
        aria-labelledby="delete-history-title"
        aria-describedby="delete-history-description"
        onCancel={(event) => {
          event.preventDefault();
          closeDeleteDialog();
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <p
              id="delete-history-title"
              className="text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              Delete this entry?
            </p>
            <p
              id="delete-history-description"
              className="text-xs text-slate-500 dark:text-slate-300"
            >
              This permanently removes the selected result.
            </p>
          </div>
          {deleteTarget ? (
            <img
              src={deleteTarget.dataUrl}
              alt={deleteTarget.sourceName ? `Result from ${deleteTarget.sourceName}` : "Result"}
              className="max-h-48 w-full rounded-2xl border border-slate-200 bg-white/80 object-contain p-3 dark:border-slate-700 dark:bg-slate-900/70"
            />
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeDeleteDialog}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-rose-600 transition hover:border-rose-300 hover:text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:border-rose-300/70"
            >
              Delete entry
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
};

export default HistorySection;
