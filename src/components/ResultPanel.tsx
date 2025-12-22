import { useEffect, useReducer, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { cx, SectionHeader, StepPill } from "./shared";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 6;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type ResultPanelProps = {
  resultId: string | null;
  resultUrl: string | null;
  resultDownloadName: string;
  resultDimensions: { width: number; height: number } | null;
  hasEdits: boolean;
  onCommitEdits: (dataUrl: string) => void;
  onDiscardEdits: () => void;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

type PaintState = {
  pointerId: number;
  lastX: number;
  lastY: number;
};

type EditHistoryState = {
  entries: string[];
  index: number;
};

type EditHistoryAction =
  | { type: "reset"; dataUrl: string | null }
  | { type: "push"; dataUrl: string }
  | { type: "undo" }
  | { type: "redo" };

const editHistoryReducer = (state: EditHistoryState, action: EditHistoryAction) => {
  switch (action.type) {
    case "reset":
      return action.dataUrl
        ? { entries: [action.dataUrl], index: 0 }
        : { entries: [], index: -1 };
    case "push": {
      const current = state.entries[state.index];
      if (current === action.dataUrl) {
        return state;
      }
      const nextEntries = state.entries.slice(0, state.index + 1);
      nextEntries.push(action.dataUrl);
      return { entries: nextEntries, index: nextEntries.length - 1 };
    }
    case "undo":
      return state.index > 0 ? { ...state, index: state.index - 1 } : state;
    case "redo":
      return state.index < state.entries.length - 1
        ? { ...state, index: state.index + 1 }
        : state;
    default:
      return state;
  }
};

const ResultPanel = ({
  resultId,
  resultUrl,
  resultDownloadName,
  resultDimensions,
  hasEdits,
  onCommitEdits,
  onDiscardEdits,
}: ResultPanelProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTool, setEditTool] = useState<"paint" | "erase">("paint");
  const [brushColor, setBrushColor] = useState("#0f172a");
  const [isPainting, setIsPainting] = useState(false);
  const [hasPendingEdits, setHasPendingEdits] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(
    null
  );
  const [editHistory, dispatchEditHistory] = useReducer(editHistoryReducer, {
    entries: [],
    index: -1,
  });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragState = useRef<DragState | null>(null);
  const paintState = useRef<PaintState | null>(null);
  const lastLoadedUrlRef = useRef<string | null>(null);
  const shouldCenterRef = useRef(false);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
    setIsEditing(false);
    setIsPainting(false);
    setHasPendingEdits(false);
    dragState.current = null;
    paintState.current = null;
    lastLoadedUrlRef.current = null;
    shouldCenterRef.current = true;
    setImageSize(null);
    dispatchEditHistory({ type: "reset", dataUrl: null });
  }, [resultId]);

  const resultWidth = resultDimensions?.width ?? null;
  const resultHeight = resultDimensions?.height ?? null;
  const canUndo = editHistory.index > 0;
  const canRedo =
    editHistory.index >= 0 && editHistory.index < editHistory.entries.length - 1;

  const drawImageToCanvas = (image: HTMLImageElement, url: string) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const width = resultWidth ?? image.naturalWidth;
    const height = resultHeight ?? image.naturalHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    lastLoadedUrlRef.current = url;
    setImageSize({ width, height });
  };

  const loadImageFromUrl = (url: string, options?: { resetHistory?: boolean }) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      drawImageToCanvas(image, url);
      if (options?.resetHistory) {
        dispatchEditHistory({ type: "reset", dataUrl: url });
      }
    };
    image.onerror = () => {
      setImageSize(null);
      if (options?.resetHistory) {
        dispatchEditHistory({ type: "reset", dataUrl: null });
      }
    };
    image.src = url;
  };

  useEffect(() => {
    if (!resultUrl) {
      setImageSize(null);
      dispatchEditHistory({ type: "reset", dataUrl: null });
      return;
    }
    if (resultUrl === lastLoadedUrlRef.current) {
      return;
    }
    loadImageFromUrl(resultUrl, { resetHistory: true });
  }, [resultHeight, resultUrl, resultWidth]);

  const getViewportMetrics = () => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return null;
    }
    const rect = viewport.getBoundingClientRect();
    const style = window.getComputedStyle(viewport);
    const paddingLeft = Number.parseFloat(style.paddingLeft || "0");
    const paddingRight = Number.parseFloat(style.paddingRight || "0");
    const paddingTop = Number.parseFloat(style.paddingTop || "0");
    const paddingBottom = Number.parseFloat(style.paddingBottom || "0");
    const borderLeft = Number.parseFloat(style.borderLeftWidth || "0");
    const borderRight = Number.parseFloat(style.borderRightWidth || "0");
    const borderTop = Number.parseFloat(style.borderTopWidth || "0");
    const borderBottom = Number.parseFloat(style.borderBottomWidth || "0");
    const contentWidth = rect.width - paddingLeft - paddingRight - borderLeft - borderRight;
    const contentHeight = rect.height - paddingTop - paddingBottom - borderTop - borderBottom;
    return { rect, paddingLeft, paddingTop, borderLeft, borderTop, contentWidth, contentHeight };
  };

  useEffect(() => {
    const metrics = getViewportMetrics();
    if (!metrics || !imageSize || !shouldCenterRef.current) {
      return;
    }
    const { contentWidth, contentHeight } = metrics;
    const nextZoom = 1;
    const nextX = (contentWidth - imageSize.width * nextZoom) / 2;
    const nextY = (contentHeight - imageSize.height * nextZoom) / 2;
    setZoom(nextZoom);
    setPan({ x: nextX, y: nextY });
    shouldCenterRef.current = false;
  }, [imageSize]);

  const dimensionLabel =
    resultDimensions && resultDimensions.width && resultDimensions.height
      ? `${resultDimensions.width}x${resultDimensions.height} px`
      : null;
  const hasResult = Boolean(resultUrl);

  const getCanvasPoint = (event: ReactPointerEvent<HTMLDivElement>) => {
    const metrics = getViewportMetrics();
    if (!metrics || !imageSize) {
      return null;
    }
    const { rect, paddingLeft, paddingTop, borderLeft, borderTop } = metrics;
    const offsetX = event.clientX - rect.left - borderLeft - paddingLeft;
    const offsetY = event.clientY - rect.top - borderTop - paddingTop;
    const x = Math.floor((offsetX - pan.x) / zoom);
    const y = Math.floor((offsetY - pan.y) / zoom);
    if (x < 0 || y < 0 || x >= imageSize.width || y >= imageSize.height) {
      return null;
    }
    return { x, y };
  };

  const drawPixel = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    if (editTool === "erase") {
      ctx.clearRect(x, y, 1, 1);
      return;
    }
    ctx.fillStyle = brushColor;
    ctx.fillRect(x, y, 1, 1);
  };

  const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    let x0 = from.x;
    let y0 = from.y;
    const x1 = to.x;
    const y1 = to.y;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      drawPixel(x0, y0);
      if (x0 === x1 && y0 === y1) {
        break;
      }
      const e2 = err * 2;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  };

  const pickColor = (point: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const data = ctx.getImageData(point.x, point.y, 1, 1).data;
    const toHex = (value: number) => value.toString(16).padStart(2, "0");
    setBrushColor(`#${toHex(data[0])}${toHex(data[1])}${toHex(data[2])}`);
  };

  const commitEdits = () => {
    if (!hasPendingEdits) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const dataUrl = canvas.toDataURL("image/png");
    lastLoadedUrlRef.current = dataUrl;
    onCommitEdits(dataUrl);
    dispatchEditHistory({ type: "push", dataUrl });
    setHasPendingEdits(false);
  };

  const applyHistoryEntry = (dataUrl: string) => {
    if (!dataUrl) {
      return;
    }
    lastLoadedUrlRef.current = dataUrl;
    setHasPendingEdits(false);
    loadImageFromUrl(dataUrl);
    onCommitEdits(dataUrl);
  };

  const handleUndo = () => {
    if (!canUndo) {
      return;
    }
    const nextIndex = editHistory.index - 1;
    const nextUrl = editHistory.entries[nextIndex];
    if (!nextUrl) {
      return;
    }
    dispatchEditHistory({ type: "undo" });
    applyHistoryEntry(nextUrl);
  };

  const handleRedo = () => {
    if (!canRedo) {
      return;
    }
    const nextIndex = editHistory.index + 1;
    const nextUrl = editHistory.entries[nextIndex];
    if (!nextUrl) {
      return;
    }
    dispatchEditHistory({ type: "redo" });
    applyHistoryEntry(nextUrl);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasResult || (event.button !== 0 && event.button !== 2)) {
      return;
    }

    if (event.button === 2) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragState.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: pan.x,
        originY: pan.y,
      };
      setIsDragging(true);
      return;
    }

    if (isEditing) {
      const point = getCanvasPoint(event);
      if (!point) {
        return;
      }
      event.preventDefault();
      if (event.altKey) {
        pickColor(point);
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      paintState.current = {
        pointerId: event.pointerId,
        lastX: point.x,
        lastY: point.y,
      };
      setIsPainting(true);
      setHasPendingEdits(true);
      drawPixel(point.x, point.y);
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const paint = paintState.current;
    if (paint && paint.pointerId === event.pointerId) {
      const point = getCanvasPoint(event);
      if (!point) {
        return;
      }
      drawLine({ x: paint.lastX, y: paint.lastY }, point);
      paintState.current = { ...paint, lastX: point.x, lastY: point.y };
      return;
    }

    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    const nextX = drag.originX + (event.clientX - drag.startX);
    const nextY = drag.originY + (event.clientY - drag.startY);
    setPan({ x: nextX, y: nextY });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const paint = paintState.current;
    if (paint && paint.pointerId === event.pointerId) {
      const target = event.currentTarget;
      if (target.hasPointerCapture(event.pointerId)) {
        target.releasePointerCapture(event.pointerId);
      }
      paintState.current = null;
      setIsPainting(false);
      commitEdits();
      return;
    }

    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    const target = event.currentTarget;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    dragState.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!hasResult) {
        return;
      }
      event.preventDefault();

      const metrics = getViewportMetrics();
      if (!metrics) {
        return;
      }
      const { rect, paddingLeft, paddingTop, borderLeft, borderTop } = metrics;
      const offsetX = event.clientX - rect.left - borderLeft - paddingLeft;
      const offsetY = event.clientY - rect.top - borderTop - paddingTop;
      const zoomFactor = event.deltaY < 0 ? 1.12 : 0.88;
      const nextZoom = clamp(zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);
      if (nextZoom === zoom) {
        return;
      }
      const imageX = (offsetX - pan.x) / zoom;
      const imageY = (offsetY - pan.y) / zoom;
      const nextX = offsetX - imageX * nextZoom;
      const nextY = offsetY - imageY * nextZoom;
      setZoom(nextZoom);
      setPan({ x: nextX, y: nextY });
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [hasResult, pan.x, pan.y, zoom]);

  const handleToggleEdit = () => {
    if (!hasResult) {
      return;
    }
    if (isEditing) {
      commitEdits();
    } else if (!editHistory.entries.length && resultUrl) {
      dispatchEditHistory({ type: "reset", dataUrl: resultUrl });
    }
    setIsEditing((prev) => !prev);
  };

  const handleDiscard = () => {
    setHasPendingEdits(false);
    setIsEditing(false);
    onDiscardEdits();
  };

  const cursorClassName = hasResult
    ? isEditing
      ? "cursor-crosshair"
      : isDragging
        ? "cursor-grabbing"
        : "cursor-grab"
    : "cursor-default";

  return (
    <section className="panel-card flex flex-col gap-5 reveal" style={{ animationDelay: "220ms" }}>
      <SectionHeader
        title="Result"
        subtitle="PNG preview with crisp grid edges."
        action={<StepPill label="Step 2" />}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-300">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-400">
            {hasResult ? "Interactive preview" : "Preview pane"}
          </span>
          {dimensionLabel ? <span className="tag-pill">Dimensions {dimensionLabel}</span> : null}
          {hasResult ? (
            <>
              <span className="tag-pill">Scroll to zoom</span>
              <span className="tag-pill">
                {isEditing && editTool === "erase"
                  ? "Drag to erase"
                  : isEditing
                    ? "Drag to paint"
                    : "Drag to pan"}
              </span>
              <span className="tag-pill">Right click to pan</span>
              {hasEdits ? <span className="tag-pill">Edited</span> : null}
            </>
          ) : null}
        </div>
      </div>

      {hasResult ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
          <button
            type="button"
            onClick={handleToggleEdit}
            className={cx(
              "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] transition",
              isEditing
                ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100"
            )}
            aria-pressed={isEditing}
          >
            {isEditing ? "Exit edit" : "Edit pixels"}
          </button>
          {isEditing ? (
            <>
              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 p-1 dark:border-slate-700 dark:bg-slate-900/60">
                <button
                  type="button"
                  onClick={() => setEditTool("paint")}
                  className={cx(
                    "rounded-full px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.25em] transition",
                    editTool === "paint"
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  )}
                  aria-pressed={editTool === "paint"}
                >
                  Paint
                </button>
                <button
                  type="button"
                  onClick={() => setEditTool("erase")}
                  className={cx(
                    "rounded-full px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.25em] transition",
                    editTool === "erase"
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  )}
                  aria-pressed={editTool === "erase"}
                >
                  Erase
                </button>
              </div>
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                Brush
                <input
                  type="color"
                  value={brushColor}
                  onChange={(event) => setBrushColor(event.target.value)}
                  className="h-6 w-6 cursor-pointer rounded-full border border-slate-200 bg-white p-0 dark:border-slate-700 dark:bg-slate-900"
                  aria-label="Brush color"
                />
              </label>
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo || isPainting}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200/70 disabled:bg-white/50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100 dark:disabled:border-slate-700/70 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-500"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo || isPainting}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200/70 disabled:bg-white/50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100 dark:disabled:border-slate-700/70 dark:disabled:bg-slate-900/50 dark:disabled:text-slate-500"
              >
                Redo
              </button>
              <span className="tag-pill">Alt to sample</span>
            </>
          ) : null}
          {hasEdits ? (
            <button
              type="button"
              onClick={handleDiscard}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-rose-600 transition hover:border-rose-300 hover:text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:border-rose-300/70"
            >
              Discard edits
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <div
          id="result"
          className="flex min-h-70 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500 dark:text-slate-300"
          aria-live="polite"
        >
          {resultUrl ? (
            <>
              <div
                ref={viewportRef}
                className={cx(
                  "preview-viewport relative w-full rounded-2xl border border-slate-200/70 bg-white/70 p-4 sm:p-6 dark:border-slate-700/70 dark:bg-slate-900/60",
                  cursorClassName,
                  isPainting && "cursor-crosshair"
                )}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onContextMenu={(event) => event.preventDefault()}
              >
                <div
                  className="preview-canvas"
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                >
                  <canvas ref={canvasRef} className="preview-image pixelated" />
                </div>
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
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-400">
                Awaiting
              </span>
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
};

export default ResultPanel;
