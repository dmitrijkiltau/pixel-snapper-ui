import type { RefObject } from "react";
import type { PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import { cx } from "./shared";
import type { PreviewBackgroundOption } from "./types";
import ResultPreview, { type EditTool } from "./ResultPreview";

type PaletteEntry = {
  color: string;
  percentage: number;
};

const IconCancel = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </svg>
);

const IconSave = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l4 4 10-10" />
  </svg>
);

const formatPercentage = (value: number) => {
  if (!Number.isFinite(value)) {
    return "0.00 %";
  }
  return `${value.toFixed(2)} %`;
};

export type ResultFullEditProps = {
  viewportRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  helpPopupRef: RefObject<HTMLDivElement | null>;
  imageSize: { width: number; height: number } | null;
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  isPainting: boolean;
  editTool: EditTool;
  brushColor: string;
  showGrid: boolean;
  showHelp: boolean;
  previewBackground: PreviewBackgroundOption;
  dimensionLabel: string | null;
  palette: PaletteEntry[];
  paletteFeedback: { color: string; label: string } | null;
  canUndo: boolean;
  canRedo: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onTouchStart: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onTouchMove: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onToggleGrid: () => void;
  onTogglePreviewBackground: () => void;
  onToggleHelp: () => void;
  onSetEditTool: (tool: EditTool) => void;
  onSetBrushColor: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onCancel: () => void;
  onPaletteAction: (color: string) => void;
};

export default function ResultFullEdit({
  viewportRef,
  canvasRef,
  helpPopupRef,
  imageSize,
  zoom,
  pan,
  isDragging,
  isPainting,
  editTool,
  brushColor,
  showGrid,
  showHelp,
  previewBackground,
  dimensionLabel,
  palette,
  paletteFeedback,
  canUndo,
  canRedo,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onToggleGrid,
  onTogglePreviewBackground,
  onToggleHelp,
  onSetEditTool,
  onSetBrushColor,
  onUndo,
  onRedo,
  onSave,
  onCancel,
  onPaletteAction,
}: ResultFullEditProps) {
  // Filter out entries with zero percentage and normalize to fill 100%
  const paletteSegments = palette
    .filter((entry) => entry.percentage > 0)
    .map((entry) => ({
      color: entry.color,
      percentage: entry.percentage,
    }));

  const paletteTotalUsage = paletteSegments.reduce(
    (acc, entry) => acc + entry.percentage,
    0
  );

  // Normalize widths to fill 100% of the bar
  const normalizedSegments = paletteSegments.map((entry) => ({
    ...entry,
    usageWidth: paletteTotalUsage > 0 ? (entry.percentage / paletteTotalUsage) * 100 : 0,
  }));

  const content = (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper">
      {/* Fullscreen toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-icon btn-icon-default"
            aria-label="Cancel edits"
          >
            <IconCancel />
          </button>
          <button
            type="button"
            onClick={onSave}
            className="btn-icon btn-icon-success"
            aria-label="Save edits"
          >
            <IconSave />
          </button>
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
          {/* Tool selection */}
          <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <input
              type="color"
              value={brushColor}
              onChange={(event) => onSetBrushColor(event.target.value)}
              className="h-5 w-5 cursor-pointer rounded-full p-0 ml-2.5"
              aria-label="Brush color"
            />
            <div className="h-5 w-px mx-2 bg-slate-200 dark:bg-slate-700" />
            <button
              type="button"
              onClick={() => onSetEditTool("paint")}
              className={cx(
                "inline-flex items-center justify-center rounded-full py-1.5 px-2.5 transition",
                editTool === "paint"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
              aria-pressed={editTool === "paint"}
              aria-label="Paint tool"
            >
              <Icon name="pen" className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSetEditTool("fill")}
              className={cx(
                "inline-flex items-center justify-center rounded-full py-1.5 px-2.5 transition",
                editTool === "fill"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
              aria-pressed={editTool === "fill"}
              aria-label="Fill tool"
            >
              <Icon name="paint-roller" className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSetEditTool("erase")}
              className={cx(
                "inline-flex items-center justify-center rounded-full py-1.5 px-2.5 transition",
                editTool === "erase"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
              aria-pressed={editTool === "erase"}
              aria-label="Erase tool"
            >
              <Icon name="eraser" className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Undo/Redo */}
          <div className="flex items-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo || isPainting}
              className="inline-flex items-center justify-center rounded-l-full px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 dark:disabled:text-slate-600"
              aria-label="Undo"
            >
              <Icon name="undo-left" className="h-3.5 w-3.5" />
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo || isPainting}
              className="inline-flex items-center justify-center rounded-r-full px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 dark:disabled:text-slate-600"
              aria-label="Redo"
            >
              <Icon name="undo-right" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={helpPopupRef}>
            <button
              type="button"
              onClick={onToggleHelp}
              className={cx(
                "btn-icon btn-icon-default",
                showHelp
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : ""
              )}
              aria-pressed={showHelp}
              aria-label="Toggle help"
              title="Help"
            >
              <Icon name="info-circle" className="h-4 w-4" />
            </button>
            {showHelp ? (
              <div className="pointer-events-auto absolute right-0 top-full z-20 mt-1 min-w-[16rem] rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-[0.7rem] text-slate-600 shadow-lg dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                <ul className="list-disc space-y-1 pl-4">
                  <li>Scroll or pinch to zoom</li>
                  <li>Two-finger pan or right-click drag</li>
                  <li>One-finger/click to {editTool === "fill" ? "fill" : editTool === "erase" ? "erase" : "paint"}</li>
                  <li>Alt+click to sample color</li>
                </ul>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onToggleGrid}
            className={cx(
              "btn-icon btn-icon-default",
              showGrid
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : ""
            )}
            aria-pressed={showGrid}
            aria-label="Toggle grid"
          >
            <Icon name="hashtag" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onTogglePreviewBackground}
            className="btn-icon btn-icon-default"
            aria-label="Toggle preview background"
          >
            <Icon 
              name={previewBackground === "light" ? "moon" : "sun"} 
              className="h-4 w-4" 
            />
          </button>
        </div>
      </div>

      {/* Fullscreen canvas area */}
      <div className="flex-1 overflow-hidden relative">
        <ResultPreview
          viewportRef={viewportRef}
          canvasRef={canvasRef}
          hasResult={true}
          imageSize={imageSize}
          zoom={zoom}
          pan={pan}
          isDragging={isDragging}
          isPainting={isPainting}
          isEditing={true}
          editTool={editTool}
          brushColor={brushColor}
          showGrid={showGrid}
          previewBackground={previewBackground}
          dimensionLabel={dimensionLabel}
          variant="fullscreen"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
      </div>

      {/* Palette bar at bottom */}
      <div className="border-t border-border bg-surface/80 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
              Palette
            </span>
            <div className="relative flex h-10 flex-1 overflow-visible rounded-2xl border border-slate-200/80 bg-slate-100/80 shadow-inner dark:border-slate-700/80 dark:bg-slate-950">
              <div className="flex h-full w-full">
                {normalizedSegments.map((segment, index) => {
                  const usageLabel = formatPercentage(segment.percentage);
                  const feedbackMatch = paletteFeedback?.color === segment.color;
                  const actionLabel = "Set brush color";
                  return (
                    <button
                      key={`${segment.color}-${index}`}
                      type="button"
                      onClick={() => onPaletteAction(segment.color)}
                      className="group relative h-full border-0 p-0 text-transparent transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 first:rounded-l-2xl last:rounded-r-2xl"
                      style={{
                        width: `${segment.usageWidth}%`,
                        backgroundColor: segment.color,
                      }}
                      aria-label={`${actionLabel} ${segment.color}`}
                    >
                      <div className="pointer-events-none absolute left-1/2 -top-2.5 flex -translate-x-1/2 flex-col items-center gap-1 z-10">
                        {feedbackMatch && paletteFeedback?.label ? (
                          <span
                            className={cx(
                              "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[0.55rem] font-semibold transition-all duration-150",
                              feedbackMatch
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100",
                              "border-slate-900/20 bg-slate-900/80 text-white dark:border-slate-100/20 dark:bg-slate-50/90 dark:text-slate-900"
                            )}
                          >
                            {paletteFeedback.label}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center rounded-full border border-slate-900/10 bg-white/90 px-2 py-0.5 text-[0.55rem] font-semibold text-slate-900 transition-opacity duration-150 opacity-0 group-hover:opacity-100 dark:border-slate-700/60 dark:bg-slate-900 dark:text-white">
                          {usageLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
