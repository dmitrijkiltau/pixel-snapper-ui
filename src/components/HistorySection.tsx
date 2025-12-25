import { useRef, useState, useMemo } from "react";
import Icon from "./Icon";
import type { HistoryItem, PreviewBackgroundOption } from "./types";
import { cx, SectionHeader, StepPill, TagPill } from "./shared";

const ITEMS_PER_PAGE = 9;

const formatTimestamp = (value: number) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
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
  const [isHovered, setIsHovered] = useState(false);
  const timestamp = formatTimestamp(item.createdAt);
  const paletteLabel =
    typeof item.kColors === "number" && Number.isFinite(item.kColors)
      ? `${item.kColors}`
      : null;
  const dimensionsLabel =
    typeof item.width === "number" &&
    typeof item.height === "number" &&
    Number.isFinite(item.width) &&
    Number.isFinite(item.height)
      ? `${item.width}×${item.height}`
      : null;
  const imageBackgroundClass = previewBackground === "dark" ? "bg-slate-900/80" : "bg-white/95";

  return (
    <article
      className={cx(
        "group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200",
        "border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm",
        "dark:border-slate-700/80 dark:bg-slate-800/90",
        "hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5",
        "dark:hover:border-slate-600",
        isActive && "ring-2 ring-indigo-500/30 border-indigo-300 dark:ring-indigo-400/30 dark:border-indigo-500/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container */}
      <div className={cx("relative aspect-square overflow-hidden", imageBackgroundClass)}>
        <img
          src={item.dataUrl}
          alt={item.sourceName ? `Result from ${item.sourceName}` : "Result image"}
          loading="lazy"
          className="pixelated h-full w-full object-contain p-4 transition-transform duration-200 group-hover:scale-105"
        />
        
        {/* Overlay actions on hover */}
        <div
          className={cx(
            "absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            className="btn-icon btn-icon-default"
            title="Edit in panel"
          >
            <Icon name="pen-new-square" className="h-4 w-4" />
          </button>
          <a
            href={item.dataUrl}
            download={item.downloadName || "snapped.png"}
            className="btn-icon btn-icon-default"
            title="Download"
          >
            <Icon name="download" className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="btn-icon btn-icon-danger"
            title="Delete"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Active indicator badge */}
        {isActive && (
          <div className="absolute top-2 right-2 flex h-6 items-center gap-1 rounded-full bg-indigo-500 px-2 text-[0.6rem] font-semibold uppercase tracking-wider text-white shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Active
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="flex flex-col gap-1.5 p-3">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
          {item.downloadName || item.sourceName || "Snapped image"}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {timestamp && (
            <span className="text-[0.65rem] text-slate-500 dark:text-slate-400">{timestamp}</span>
          )}
          {dimensionsLabel && (
            <TagPill label={dimensionsLabel} />
          )}
          {paletteLabel && (
            <TagPill label={`${paletteLabel} col`} />
          )}
        </div>
      </div>
    </article>
  );
};

const HistoryEmpty = () => (
  <div className="empty-state bg-linear-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50">
    <div className="empty-state-icon">
      <Icon name="gallery-add" className="h-7 w-7" />
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No history yet</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">Your snapped images will appear here</p>
    </div>
  </div>
);

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];
  
  // Always show first page
  pages.push(1);
  
  // Calculate range around current page
  const rangeStart = Math.max(2, currentPage - 1);
  const rangeEnd = Math.min(totalPages - 1, currentPage + 1);
  
  if (rangeStart > 2) {
    pages.push("ellipsis");
  }
  
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }
  
  if (rangeEnd < totalPages - 1) {
    pages.push("ellipsis");
  }
  
  // Always show last page if more than 1
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cx(
          "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition",
          "border border-slate-200 bg-white/80 text-slate-600",
          "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
          "dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300",
          "dark:hover:border-slate-600 dark:hover:bg-slate-700/80 dark:hover:text-slate-100",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/80 dark:disabled:hover:bg-slate-800/80"
        )}
        aria-label="Previous page"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {pages.map((page, idx) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${idx}`}
            className="flex h-8 w-8 items-center justify-center text-xs text-slate-400 dark:text-slate-500"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={cx(
              "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition",
              page === currentPage
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "border border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700/80"
            )}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cx(
          "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition",
          "border border-slate-200 bg-white/80 text-slate-600",
          "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
          "dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300",
          "dark:hover:border-slate-600 dark:hover:bg-slate-700/80 dark:hover:text-slate-100",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/80 dark:disabled:hover:bg-slate-800/80"
        )}
        aria-label="Next page"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
};

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
  const [currentPage, setCurrentPage] = useState(1);
  const hasItems = items.length > 0;

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  
  // Reset to valid page when items change
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  if (validCurrentPage !== currentPage) {
    setCurrentPage(validCurrentPage);
  }

  const paginatedItems = useMemo(() => {
    if (items.length <= ITEMS_PER_PAGE) return items;
    const startIdx = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [items, validCurrentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to history section smoothly
    document.getElementById("history")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
    setCurrentPage(1);
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
    <section className="panel-card flex flex-col gap-6 reveal" style={{ animationDelay: "260ms" }}>
      <SectionHeader
        title="History"
        subtitle="Your recent creations, saved locally."
        action={<StepPill label="Local" />}
      />

      {/* Stats and actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50/80 px-4 py-3 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/80 text-slate-600 dark:bg-slate-700/80 dark:text-slate-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {items.length} {items.length === 1 ? "image" : "images"}
            </span>
            {totalPages > 1 && (
              <span className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                Page {validCurrentPage} of {totalPages}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={openClearDialog}
          disabled={!hasItems}
          className={cx(
            "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
            "border border-rose-200 bg-rose-50 text-rose-600",
            "hover:border-rose-300 hover:bg-rose-100 hover:text-rose-700",
            "dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
            "dark:hover:border-rose-400/50 dark:hover:bg-rose-500/20",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear all
        </button>
      </div>

      <div id="history" className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {items.length === 0 ? (
            <HistoryEmpty />
          ) : (
            paginatedItems.map((item) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={validCurrentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

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
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <p
                id="clear-history-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Clear all history?
              </p>
              <p
                id="clear-history-description"
                className="text-sm text-slate-500 dark:text-slate-400"
              >
                This will permanently remove all {items.length} saved {items.length === 1 ? "image" : "images"} from this browser. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={closeClearDialog}
              className="dialog-btn dialog-btn-default"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmClear}
              className="dialog-btn dialog-btn-danger"
            >
              Delete all
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
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <p
                id="delete-history-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Delete this image?
              </p>
              <p
                id="delete-history-description"
                className="text-sm text-slate-500 dark:text-slate-400"
              >
                This will permanently remove the selected result. This action cannot be undone.
              </p>
            </div>
          </div>
          {deleteTarget && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <img
                src={deleteTarget.dataUrl}
                alt={deleteTarget.sourceName ? `Result from ${deleteTarget.sourceName}` : "Result"}
                className="pixelated mx-auto max-h-40 w-full object-contain p-4"
              />
              {deleteTarget.downloadName && (
                <div className="border-t border-slate-200 px-3 py-2 text-center text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">
                  {deleteTarget.downloadName}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={closeDeleteDialog}
              className="dialog-btn dialog-btn-default"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="dialog-btn dialog-btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
};

export default HistorySection;
