import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import { cx, SectionHeader, StepPill } from "./shared";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 6;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type ResultPanelProps = {
  resultUrl: string | null;
  resultDownloadName: string;
  resultDimensions: { width: number; height: number } | null;
};

const ResultPanel = ({
  resultUrl,
  resultDownloadName,
  resultDimensions,
}: ResultPanelProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
    dragState.current = null;
  }, [resultUrl]);

  const dimensionLabel =
    resultDimensions && resultDimensions.width && resultDimensions.height
      ? `${resultDimensions.width}x${resultDimensions.height} px`
      : null;
  const hasResult = Boolean(resultUrl);

  const handleImageLoad = () => {
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (!viewport || !image) {
      return;
    }
    const { width, height } = viewport.getBoundingClientRect();
    const nextZoom = 1;
    const nextX = (width - image.naturalWidth * nextZoom) / 2;
    const nextY = (height - image.naturalHeight * nextZoom) / 2;
    setZoom(nextZoom);
    setPan({ x: nextX, y: nextY });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasResult || event.button !== 0) {
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
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    const nextX = drag.originX + (event.clientX - drag.startX);
    const nextY = drag.originY + (event.clientY - drag.startY);
    setPan({ x: nextX, y: nextY });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
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

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!hasResult) {
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const rect = viewport.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
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
          {dimensionLabel ? (
            <span className="tag-pill">
              Dimensions {dimensionLabel}
            </span>
          ) : null}
          {hasResult ? (
            <>
              <span className="tag-pill">Scroll to zoom</span>
              <span className="tag-pill">Drag to pan</span>
            </>
          ) : null}
        </div>
      </div>

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
                  hasResult ? "cursor-grab" : "cursor-default",
                  isDragging && "cursor-grabbing"
                )}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
              >
                <div
                  className="preview-canvas"
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                >
                  <img
                    ref={imageRef}
                    src={resultUrl}
                    alt="Snapped result"
                    className="preview-image pixelated"
                    draggable={false}
                    onLoad={handleImageLoad}
                  />
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
};

export default ResultPanel;
