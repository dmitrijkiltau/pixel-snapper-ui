import { forwardRef, useEffect, useReducer, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent } from "react";
import { cx, SectionHeader, StepPill } from "./shared";
import type { PreviewBackgroundOption } from "./types";
import ResultPreview, { type EditTool } from "./ResultPreview";
import ResultFullEdit from "./ResultFullEdit";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 12;
const PALETTE_SIZE = 12;

type PaletteEntry = {
  color: string;
  percentage: number;
};

const IconMoreVertical = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path d="M8 12H8.00901M12.0045 12H12.0135M15.991 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const IconHelp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 17V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="1" cy="1" r="1" transform="matrix(1 0 0 -1 11 9)" fill="currentColor"/>
  </svg>
);

const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 17.25V20h2.75L18.81 8.94l-2.75-2.75L4 17.25z" />
    <path d="M16.06 5.69 18.31 7.94" />
  </svg>
);

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const toHex = (value: number) => value.toString(16).padStart(2, "0");

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const normalizePalette = (entries: PaletteEntry[], size: number, fallbackColor: string) => {
  const next = entries.slice(0, size);
  while (next.length < size) {
    next.push({ color: fallbackColor, percentage: 0 });
  }
  return next;
};

const formatPercentage = (value: number) => {
  if (!Number.isFinite(value)) {
    return "0.00 %";
  }
  return `${value.toFixed(2)} %`;
};

type ResultPanelProps = {
  resultId: string | null;
  resultUrl: string | null;
  resultOriginalUrl: string | null;
  resultDownloadName: string;
  resultDimensions: { width: number; height: number } | null;
  hasEdits: boolean;
  onCommitEdits: (dataUrl: string) => void;
  onDiscardEdits: () => void;
  showGrid: boolean;
  previewBackground: PreviewBackgroundOption;
  onToggleGrid: () => void;
  onTogglePreviewBackground: () => void;
  onClearSelection: () => void;
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

type TouchState = {
  initialDistance: number;
  initialZoom: number;
  initialPan: { x: number; y: number };
  initialCenter: { x: number; y: number };
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

const ResultPanel = forwardRef<HTMLElement, ResultPanelProps>(({
  resultId,
  resultUrl,
  resultOriginalUrl,
  resultDownloadName,
  resultDimensions,
  hasEdits,
  onCommitEdits,
  onDiscardEdits,
  showGrid,
  previewBackground,
  onToggleGrid,
  onTogglePreviewBackground,
  onClearSelection,
}, ref) => {
  // Preview mode zoom/pan
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  // Edit mode zoom/pan (independent from preview)
  const [editZoom, setEditZoom] = useState(1);
  const [editPan, setEditPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTool, setEditTool] = useState<EditTool>("paint");
  const [brushColor, setBrushColor] = useState("#0f172a");
  const [palette, setPalette] = useState<PaletteEntry[]>(
    Array.from({ length: PALETTE_SIZE }, () => ({ color: "#0f172a", percentage: 0 }))
  );
  const [paletteFeedback, setPaletteFeedback] = useState<{ color: string; label: string } | null>(
    null
  );
  const paletteFeedbackTimeoutRef = useRef<number | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [hasPendingEdits, setHasPendingEdits] = useState(false);
  const [hasEditedInSession, setHasEditedInSession] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(
    null
  );
  const [editHistory, dispatchEditHistory] = useReducer(editHistoryReducer, {
    entries: [],
    index: -1,
  });
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const editViewportRef = useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const editCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const restoreDialogRef = useRef<HTMLDialogElement | null>(null);
  const cancelDialogRef = useRef<HTMLDialogElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const helpPopupRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<DragState | null>(null);
  const paintState = useRef<PaintState | null>(null);
  const touchState = useRef<TouchState | null>(null);
  const lastLoadedUrlRef = useRef<string | null>(null);
  const shouldCenterPreviewRef = useRef(false);
  const shouldCenterEditRef = useRef(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    setPreviewZoom(1);
    setPreviewPan({ x: 0, y: 0 });
    setEditZoom(1);
    setEditPan({ x: 0, y: 0 });
    setIsDragging(false);
    setIsEditing(false);
    setIsPainting(false);
    setHasPendingEdits(false);
    setHasEditedInSession(false);
    setPalette(
      Array.from({ length: PALETTE_SIZE }, () => ({ color: "#0f172a", percentage: 0 }))
    );
    setShowHelp(false);
    setShowMoreMenu(false);
    dragState.current = null;
    paintState.current = null;
    touchState.current = null;
    lastLoadedUrlRef.current = null;
    shouldCenterPreviewRef.current = true;
    setImageSize(null);
    dispatchEditHistory({ type: "reset", dataUrl: null });
  }, [resultId]);

  // Close more menu when clicking outside
  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreMenu]);

  useEffect(() => {
    if (!showHelp) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (helpPopupRef.current && !helpPopupRef.current.contains(event.target as Node)) {
        setShowHelp(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showHelp]);

  useEffect(() => {
    return () => {
      if (paletteFeedbackTimeoutRef.current) {
        window.clearTimeout(paletteFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const resultWidth = resultDimensions?.width ?? null;
  const resultHeight = resultDimensions?.height ?? null;
  const canUndo = editHistory.index > 0;
  const canRedo =
    editHistory.index >= 0 && editHistory.index < editHistory.entries.length - 1;
  const getCanvasContext = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return null;
    }
    ctx.imageSmoothingEnabled = false;
    return ctx;
  };

  const drawImageToCanvas = (image: HTMLImageElement, url: string) => {
    const width = resultWidth ?? image.naturalWidth;
    const height = resultHeight ?? image.naturalHeight;
    
    // Draw to preview canvas
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      previewCanvas.width = width;
      previewCanvas.height = height;
      const previewCtx = getCanvasContext(previewCanvas);
      if (previewCtx) {
        previewCtx.imageSmoothingEnabled = false;
        previewCtx.clearRect(0, 0, width, height);
        previewCtx.drawImage(image, 0, 0, width, height);
      }
    }
    
    // Draw to edit canvas if it exists
    const editCanvas = editCanvasRef.current;
    if (editCanvas) {
      editCanvas.width = width;
      editCanvas.height = height;
      const editCtx = getCanvasContext(editCanvas);
      if (editCtx) {
        editCtx.imageSmoothingEnabled = false;
        editCtx.clearRect(0, 0, width, height);
        editCtx.drawImage(image, 0, 0, width, height);
      }
    }
    
    lastLoadedUrlRef.current = url;
    setImageSize({ width, height });
    refreshPaletteFromCanvas();
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

  const getViewportMetrics = (viewportRef: React.RefObject<HTMLDivElement | null>) => {
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

  // Center preview when image loads
  useEffect(() => {
    const metrics = getViewportMetrics(previewViewportRef);
    if (!metrics || !imageSize || !shouldCenterPreviewRef.current) {
      return;
    }
    const { contentWidth, contentHeight } = metrics;
    const nextZoom = 1;
    const nextX = (contentWidth - imageSize.width * nextZoom) / 2;
    const nextY = (contentHeight - imageSize.height * nextZoom) / 2;
    setPreviewZoom(nextZoom);
    setPreviewPan({ x: nextX, y: nextY });
    shouldCenterPreviewRef.current = false;
  }, [imageSize]);

  const dimensionLabel =
    resultDimensions && resultDimensions.width && resultDimensions.height
      ? `${resultDimensions.width}x${resultDimensions.height} px`
      : null;
  const hasResult = Boolean(resultUrl);
  const canRestore = hasEdits && Boolean(resultOriginalUrl);

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

  function extractPaletteFromCanvas(canvas: HTMLCanvasElement): PaletteEntry[] {
    const ctx = getCanvasContext(canvas);
    if (!ctx) {
      return [];
    }
    const { width, height } = canvas;
    if (!width || !height) {
      return [];
    }
    const data = ctx.getImageData(0, 0, width, height).data;
    const counts = new Map<string, number>();
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      // Skip fully transparent pixels
      if (alpha === 0) {
        continue;
      }
      // Extract RGB values only, ignoring alpha for color identity
      const hex = `#${toHex(data[i])}${toHex(data[i + 1])}${toHex(data[i + 2])}`;
      counts.set(hex, (counts.get(hex) ?? 0) + 1);
      total += 1;
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, PALETTE_SIZE)
      .map(([hex, count]) => ({
        color: hex,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }));
  }

  function refreshPaletteFromCanvas(force = false) {
    if (isEditing && !force) {
      return;
    }
    // Use edit canvas if editing, otherwise preview canvas
    const canvas = isEditing ? editCanvasRef.current : previewCanvasRef.current;
    if (!canvas) {
      return;
    }
    const extracted = extractPaletteFromCanvas(canvas);
    setPalette((prev) =>
      normalizePalette(
        extracted,
        PALETTE_SIZE,
        prev[0]?.color ?? brushColor
      )
    );
  }

  const getCanvasPoint = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Only used during editing, so always use edit viewport and zoom/pan
    const metrics = getViewportMetrics(editViewportRef);
    if (!metrics || !imageSize) {
      return null;
    }
    const { rect, paddingLeft, paddingTop, borderLeft, borderTop } = metrics;
    const offsetX = event.clientX - rect.left - borderLeft - paddingLeft;
    const offsetY = event.clientY - rect.top - borderTop - paddingTop;
    const x = Math.floor((offsetX - editPan.x) / editZoom);
    const y = Math.floor((offsetY - editPan.y) / editZoom);
    if (x < 0 || y < 0 || x >= imageSize.width || y >= imageSize.height) {
      return null;
    }
    return { x, y };
  };

  const drawPixel = (x: number, y: number) => {
    const canvas = editCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = getCanvasContext(canvas);
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
    const canvas = editCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = getCanvasContext(canvas);
    if (!ctx) {
      return;
    }
    const data = ctx.getImageData(point.x, point.y, 1, 1).data;
    setBrushColor(`#${toHex(data[0])}${toHex(data[1])}${toHex(data[2])}`);
  };

  const fillAtPoint = (point: { x: number; y: number }) => {
    const canvas = editCanvasRef.current;
    if (!canvas) {
      return false;
    }
    const ctx = getCanvasContext(canvas);
    if (!ctx) {
      return false;
    }
    const { width, height } = canvas;
    const image = ctx.getImageData(0, 0, width, height);
    const data = image.data;
    const startIndex = (point.y * width + point.x) * 4;
    const target = {
      r: data[startIndex],
      g: data[startIndex + 1],
      b: data[startIndex + 2],
      a: data[startIndex + 3],
    };
    const fill = { ...hexToRgb(brushColor), a: 255 };
    if (
      target.r === fill.r &&
      target.g === fill.g &&
      target.b === fill.b &&
      target.a === fill.a
    ) {
      return false;
    }

    const visited = new Set<number>();
    const stack: Array<{ x: number; y: number }> = [point];
    visited.add(point.y * width + point.x);

    while (stack.length) {
      const current = stack.pop();
      if (!current) {
        continue;
      }
      const idx = (current.y * width + current.x) * 4;
      if (
        data[idx] !== target.r ||
        data[idx + 1] !== target.g ||
        data[idx + 2] !== target.b ||
        data[idx + 3] !== target.a
      ) {
        continue;
      }
      data[idx] = fill.r;
      data[idx + 1] = fill.g;
      data[idx + 2] = fill.b;
      data[idx + 3] = fill.a;

      if (current.x > 0) {
        const nextIdx = current.y * width + (current.x - 1);
        if (!visited.has(nextIdx)) {
          visited.add(nextIdx);
          stack.push({ x: current.x - 1, y: current.y });
        }
      }
      if (current.x < width - 1) {
        const nextIdx = current.y * width + (current.x + 1);
        if (!visited.has(nextIdx)) {
          visited.add(nextIdx);
          stack.push({ x: current.x + 1, y: current.y });
        }
      }
      if (current.y > 0) {
        const nextIdx = (current.y - 1) * width + current.x;
        if (!visited.has(nextIdx)) {
          visited.add(nextIdx);
          stack.push({ x: current.x, y: current.y - 1 });
        }
      }
      if (current.y < height - 1) {
        const nextIdx = (current.y + 1) * width + current.x;
        if (!visited.has(nextIdx)) {
          visited.add(nextIdx);
          stack.push({ x: current.x, y: current.y + 1 });
        }
      }
    }
    ctx.putImageData(image, 0, 0);
    return true;
  };

  const commitEdits = (options?: { force?: boolean }) => {
    if (!hasPendingEdits && !options?.force) {
      return;
    }
    const canvas = editCanvasRef.current;
    if (!canvas) {
      return;
    }
    const dataUrl = canvas.toDataURL("image/png");
    lastLoadedUrlRef.current = dataUrl;
    dispatchEditHistory({ type: "push", dataUrl });
    setHasPendingEdits(false);
    refreshPaletteFromCanvas(true);
  };

  const applyHistoryEntry = (dataUrl: string) => {
    if (!dataUrl) {
      return;
    }
    lastLoadedUrlRef.current = dataUrl;
    setHasPendingEdits(false);
    loadImageFromUrl(dataUrl);
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

  const showPaletteFeedback = (color: string, label: string) => {
    setPaletteFeedback({ color, label });
    if (paletteFeedbackTimeoutRef.current) {
      window.clearTimeout(paletteFeedbackTimeoutRef.current);
    }
    paletteFeedbackTimeoutRef.current = window.setTimeout(() => {
      setPaletteFeedback(null);
      paletteFeedbackTimeoutRef.current = null;
    }, 1500);
  };

  const copyPaletteColor = async (color: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(color);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = color;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
    } catch {
      // ignore copy failures, still show feedback
    } finally {
      showPaletteFeedback(color, "copied hex");
    }
  };

  const handlePaletteSegmentAction = (color: string) => {
    if (isEditing) {
      setBrushColor(color);
      showPaletteFeedback(color, "color set");
      return;
    }
    copyPaletteColor(color);
  };

  // Preview mode event handlers
  const handlePreviewPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasResult) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0 && event.button !== 2) {
      return;
    }

    // Pan with any click in preview mode
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: previewPan.x,
      originY: previewPan.y,
    };
    setIsDragging(true);
  };

  const handlePreviewPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    const nextX = drag.originX + (event.clientX - drag.startX);
    const nextY = drag.originY + (event.clientY - drag.startY);
    setPreviewPan({ x: nextX, y: nextY });
  };

  const handlePreviewPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
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

  // Edit mode event handlers
  const handleEditPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasResult) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0 && event.button !== 2) {
      return;
    }

    // Right-click pans in edit mode
    if (event.button === 2) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragState.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: editPan.x,
        originY: editPan.y,
      };
      setIsDragging(true);
      return;
    }

    // Skip if a two-finger gesture is active
    if (touchState.current) {
      return;
    }

    const point = getCanvasPoint(event);
    if (point) {
      event.preventDefault();
      if (event.altKey) {
        pickColor(point);
        return;
      }
      if (editTool === "fill") {
        const didFill = fillAtPoint(point);
        if (didFill) {
          setHasEditedInSession(true);
          commitEdits({ force: true });
        }
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
      setHasEditedInSession(true);
      drawPixel(point.x, point.y);
      return;
    }

    // Click outside canvas - pan
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: editPan.x,
      originY: editPan.y,
    };
    setIsDragging(true);
  };

  const handleEditPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
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
    setEditPan({ x: nextX, y: nextY });
  };

  const handleEditPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
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

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  // Preview touch handlers
  const handlePreviewTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!hasResult) return;

    // Two-finger gesture for pan/zoom
    if (event.touches.length === 2) {
      event.preventDefault();
      const distance = getTouchDistance(event.touches);
      const center = getTouchCenter(event.touches);
      touchState.current = {
        initialDistance: distance,
        initialZoom: previewZoom,
        initialPan: { ...previewPan },
        initialCenter: center,
      };
      return;
    }
  };

  const handlePreviewTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!hasResult) return;

    // Handle two-finger pan/zoom
    if (event.touches.length === 2 && touchState.current) {
      event.preventDefault();
      const touch = touchState.current;
      const currentDistance = getTouchDistance(event.touches);
      const currentCenter = getTouchCenter(event.touches);

      // Calculate new zoom based on pinch
      const scale = currentDistance / touch.initialDistance;
      const nextZoom = clamp(touch.initialZoom * scale, MIN_ZOOM, MAX_ZOOM);

      // Get viewport metrics for coordinate conversion
      const metrics = getViewportMetrics(previewViewportRef);
      if (!metrics) return;
      const { rect, paddingLeft, paddingTop, borderLeft, borderTop } = metrics;

      // Calculate the focal point in viewport coordinates (initial center)
      const focalX = touch.initialCenter.x - rect.left - borderLeft - paddingLeft;
      const focalY = touch.initialCenter.y - rect.top - borderTop - paddingTop;

      // Calculate image coordinates at the focal point with initial zoom
      const imageX = (focalX - touch.initialPan.x) / touch.initialZoom;
      const imageY = (focalY - touch.initialPan.y) / touch.initialZoom;

      // Calculate new pan to keep the focal point stationary after zoom
      const zoomedPanX = focalX - imageX * nextZoom;
      const zoomedPanY = focalY - imageY * nextZoom;

      // Add two-finger pan offset
      const panDeltaX = currentCenter.x - touch.initialCenter.x;
      const panDeltaY = currentCenter.y - touch.initialCenter.y;

      setPreviewZoom(nextZoom);
      setPreviewPan({
        x: zoomedPanX + panDeltaX,
        y: zoomedPanY + panDeltaY,
      });
      return;
    }
  };

  const handlePreviewTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    // End two-finger gesture when fewer than 2 touches remain
    if (event.touches.length < 2) {
      touchState.current = null;
    }
  };

  // Edit touch handlers
  const handleEditTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!hasResult) return;

    // Two-finger gesture for pan/zoom
    if (event.touches.length === 2) {
      event.preventDefault();
      const distance = getTouchDistance(event.touches);
      const center = getTouchCenter(event.touches);
      touchState.current = {
        initialDistance: distance,
        initialZoom: editZoom,
        initialPan: { ...editPan },
        initialCenter: center,
      };
      return;
    }
  };

  const handleEditTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!hasResult) return;

    // Handle two-finger pan/zoom
    if (event.touches.length === 2 && touchState.current) {
      event.preventDefault();
      const touch = touchState.current;
      const currentDistance = getTouchDistance(event.touches);
      const currentCenter = getTouchCenter(event.touches);

      // Calculate new zoom based on pinch
      const scale = currentDistance / touch.initialDistance;
      const nextZoom = clamp(touch.initialZoom * scale, MIN_ZOOM, MAX_ZOOM);

      // Get viewport metrics for coordinate conversion
      const metrics = getViewportMetrics(editViewportRef);
      if (!metrics) return;
      const { rect, paddingLeft, paddingTop, borderLeft, borderTop } = metrics;

      // Calculate the focal point in viewport coordinates (initial center)
      const focalX = touch.initialCenter.x - rect.left - borderLeft - paddingLeft;
      const focalY = touch.initialCenter.y - rect.top - borderTop - paddingTop;

      // Calculate image coordinates at the focal point with initial zoom
      const imageX = (focalX - touch.initialPan.x) / touch.initialZoom;
      const imageY = (focalY - touch.initialPan.y) / touch.initialZoom;

      // Calculate new pan to keep the focal point stationary after zoom
      const zoomedPanX = focalX - imageX * nextZoom;
      const zoomedPanY = focalY - imageY * nextZoom;

      // Add two-finger pan offset
      const panDeltaX = currentCenter.x - touch.initialCenter.x;
      const panDeltaY = currentCenter.y - touch.initialCenter.y;

      setEditZoom(nextZoom);
      setEditPan({
        x: zoomedPanX + panDeltaX,
        y: zoomedPanY + panDeltaY,
      });
      return;
    }
  };

  const handleEditTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    // End two-finger gesture when fewer than 2 touches remain
    if (event.touches.length < 2) {
      touchState.current = null;
    }
  };

  // Preview wheel handler
  useEffect(() => {
    const viewport = previewViewportRef.current;
    if (!viewport || isEditing) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!hasResult) {
        return;
      }
      event.preventDefault();

      const metrics = getViewportMetrics(previewViewportRef);
      if (!metrics) {
        return;
      }
      const { rect, paddingLeft, paddingTop, borderLeft, borderTop } = metrics;
      const offsetX = event.clientX - rect.left - borderLeft - paddingLeft;
      const offsetY = event.clientY - rect.top - borderTop - paddingTop;
      const zoomFactor = event.deltaY < 0 ? 1.12 : 0.88;
      const nextZoom = clamp(previewZoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);
      if (nextZoom === previewZoom) {
        return;
      }
      const imageX = (offsetX - previewPan.x) / previewZoom;
      const imageY = (offsetY - previewPan.y) / previewZoom;
      const nextX = offsetX - imageX * nextZoom;
      const nextY = offsetY - imageY * nextZoom;
      setPreviewZoom(nextZoom);
      setPreviewPan({ x: nextX, y: nextY });
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [hasResult, isEditing, previewPan.x, previewPan.y, previewZoom]);

  // Edit wheel handler
  useEffect(() => {
    const viewport = editViewportRef.current;
    if (!viewport || !isEditing) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!hasResult) {
        return;
      }
      event.preventDefault();

      const metrics = getViewportMetrics(editViewportRef);
      if (!metrics) {
        return;
      }
      const { rect, paddingLeft, paddingTop, borderLeft, borderTop } = metrics;
      const offsetX = event.clientX - rect.left - borderLeft - paddingLeft;
      const offsetY = event.clientY - rect.top - borderTop - paddingTop;
      const zoomFactor = event.deltaY < 0 ? 1.12 : 0.88;
      const nextZoom = clamp(editZoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);
      if (nextZoom === editZoom) {
        return;
      }
      const imageX = (offsetX - editPan.x) / editZoom;
      const imageY = (offsetY - editPan.y) / editZoom;
      const nextX = offsetX - imageX * nextZoom;
      const nextY = offsetY - imageY * nextZoom;
      setEditZoom(nextZoom);
      setEditPan({ x: nextX, y: nextY });
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [hasResult, isEditing, editPan.x, editPan.y, editZoom]);

  useEffect(() => {
    if (!isEditing && hasResult) {
      refreshPaletteFromCanvas();
    }
  }, [hasResult, isEditing]);

  // Redraw image when entering/exiting edit mode (canvas element changes)
  useEffect(() => {
    if (!hasResult) {
      return;
    }
    // When exiting edit mode, always load from resultUrl (parent state)
    // When entering edit mode, load from edit history or result
    const currentUrl = isEditing 
      ? (editHistory.entries[editHistory.index] ?? resultUrl)
      : resultUrl;
    if (currentUrl) {
      loadImageFromUrl(currentUrl);
    }
  }, [isEditing]);

  // Center edit view when entering edit mode
  useEffect(() => {
    if (!isEditing || !imageSize || !shouldCenterEditRef.current) {
      return;
    }
    // Wait a frame for the fullscreen portal to render
    requestAnimationFrame(() => {
      const metrics = getViewportMetrics(editViewportRef);
      if (!metrics) {
        return;
      }
      const { contentWidth, contentHeight } = metrics;
      const nextZoom = 1;
      const nextX = (contentWidth - imageSize.width * nextZoom) / 2;
      const nextY = (contentHeight - imageSize.height * nextZoom) / 2;
      setEditZoom(nextZoom);
      setEditPan({ x: nextX, y: nextY });
      shouldCenterEditRef.current = false;
    });
  }, [isEditing, imageSize]);

  const handleStartEditing = () => {
    if (!hasResult) {
      return;
    }
    // Always save the current state as the starting point for this edit session
    // This ensures that discarding reverts to the state before this edit, not the original
    if (resultUrl) {
      dispatchEditHistory({ type: "reset", dataUrl: resultUrl });
    }
    // Reset edit zoom/pan and mark for centering
    setEditZoom(1);
    setEditPan({ x: 0, y: 0 });
    shouldCenterEditRef.current = true;
    setIsEditing(true);
  };

  const handleSaveEdits = () => {
    if (!hasResult) {
      return;
    }
    // Get the final image from edit canvas and sync to preview
    const editCanvas = editCanvasRef.current;
    if (editCanvas) {
      const dataUrl = editCanvas.toDataURL("image/png");
      lastLoadedUrlRef.current = dataUrl;
      onCommitEdits(dataUrl);
      // Clear edit history on save - next edit session should start fresh
      dispatchEditHistory({ type: "reset", dataUrl });
      // Sync to preview canvas
      loadImageFromUrl(dataUrl);
    }
    setHasPendingEdits(false);
    setIsEditing(false);
    setHasEditedInSession(false);
  };

  const handleDiscard = () => {
    const initialUrl = editHistory.entries[0];
    if (initialUrl && editCanvasRef.current) {
      // Restore edit canvas to initial state
      const image = new Image();
      image.onload = () => {
        const editCanvas = editCanvasRef.current;
        if (!editCanvas) return;
        
        const width = resultWidth ?? image.naturalWidth;
        const height = resultHeight ?? image.naturalHeight;
        editCanvas.width = width;
        editCanvas.height = height;
        
        const ctx = getCanvasContext(editCanvas);
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(image, 0, 0, width, height);
        }
      };
      image.src = initialUrl;
    }

    setHasPendingEdits(false);
    setHasEditedInSession(false);
    setIsEditing(false);
  };

  const openCancelDialog = () => {
    if (!hasPendingEdits && !hasEditedInSession) {
      handleDiscard();
      return;
    }
    const dialog = cancelDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  };

  const closeCancelDialog = () => {
    const dialog = cancelDialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
  };

  const handleCancelConfirm = () => {
    handleDiscard();
    closeCancelDialog();
  };

  const openRestoreDialog = () => {
    if (!canRestore) {
      return;
    }
    const dialog = restoreDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  };

  const closeRestoreDialog = () => {
    const dialog = restoreDialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
  };

  const handleRestoreConfirm = () => {
    setHasPendingEdits(false);
    setHasEditedInSession(false);
    setIsEditing(false);
    onDiscardEdits();
    closeRestoreDialog();
  };

  return (
    <>
      {isEditing ? (
        <ResultFullEdit
          viewportRef={editViewportRef}
          canvasRef={editCanvasRef}
          helpPopupRef={helpPopupRef}
          imageSize={imageSize}
          zoom={editZoom}
          pan={editPan}
          isDragging={isDragging}
          isPainting={isPainting}
          editTool={editTool}
          brushColor={brushColor}
          showGrid={showGrid}
          showHelp={showHelp}
          previewBackground={previewBackground}
          dimensionLabel={dimensionLabel}
          palette={palette}
          paletteFeedback={paletteFeedback}
          canUndo={canUndo}
          canRedo={canRedo}
          onPointerDown={handleEditPointerDown}
          onPointerMove={handleEditPointerMove}
          onPointerUp={handleEditPointerUp}
          onTouchStart={handleEditTouchStart}
          onTouchMove={handleEditTouchMove}
          onTouchEnd={handleEditTouchEnd}
          onToggleGrid={onToggleGrid}
          onTogglePreviewBackground={onTogglePreviewBackground}
          onToggleHelp={() => setShowHelp((prev) => !prev)}
          onSetEditTool={setEditTool}
          onSetBrushColor={setBrushColor}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSaveEdits}
          onCancel={openCancelDialog}
          onPaletteAction={handlePaletteSegmentAction}
        />
      ) : null}
      <section ref={ref} className="panel-card flex flex-col gap-5 reveal" style={{ animationDelay: "220ms" }}>
        <SectionHeader
          title="Result"
          subtitle="PNG preview with crisp grid edges."
          action={<StepPill label="Step 2" />}
        />

        {hasResult && !isEditing ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartEditing}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                aria-label="Start editing result"
              >
                <IconEdit />
              </button>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <div className="relative" ref={helpPopupRef}>
                <button
                  type="button"
                  onClick={() => setShowHelp((prev) => !prev)}
                  className={cx(
                    "inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200",
                    showHelp
                      ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                      : ""
                  )}
                  aria-pressed={showHelp}
                  aria-label="Toggle help"
                  title="Help"
                >
                  <IconHelp />
                </button>
                {showHelp && hasResult ? (
                  <div className="pointer-events-auto absolute right-0 top-full z-20 mt-1 min-w-[16rem] rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-[0.7rem] text-slate-600 shadow-lg dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                    <ul className="list-disc space-y-1 pl-4">
                      <li>Scroll or pinch to zoom</li>
                      <li>One-finger/drag or right-click to pan</li>
                    </ul>
                  </div>
                ) : null}
              </div>

              {/* More menu for secondary actions */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowMoreMenu((prev) => !prev)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
                  aria-label="More options"
                  aria-expanded={showMoreMenu}
                >
                  <IconMoreVertical />
                </button>
                {showMoreMenu ? (
                  <div className="dropdown-menu">
                    {hasEdits ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          openRestoreDialog();
                        }}
                        className="dropdown-item"
                      >
                        Restore original
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        onClearSelection();
                      }}
                      className="dropdown-item"
                    >
                      Clear selection
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {!isEditing ? (
          <div className="flex flex-col gap-4">
            <div
              id="result"
              className="flex min-h-70 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500 dark:text-slate-300"
              aria-live="polite"
            >
              {resultUrl ? (
                <>
                  <ResultPreview
                    viewportRef={previewViewportRef}
                    canvasRef={previewCanvasRef}
                    hasResult={hasResult}
                    imageSize={imageSize}
                    zoom={previewZoom}
                    pan={previewPan}
                    isDragging={isDragging}
                    isPainting={false}
                    isEditing={false}
                    editTool={editTool}
                    brushColor={brushColor}
                    showGrid={showGrid}
                    previewBackground={previewBackground}
                    dimensionLabel={dimensionLabel}
                    variant="panel"
                    onPointerDown={handlePreviewPointerDown}
                    onPointerMove={handlePreviewPointerMove}
                    onPointerUp={handlePreviewPointerUp}
                    onTouchStart={handlePreviewTouchStart}
                    onTouchMove={handlePreviewTouchMove}
                    onTouchEnd={handlePreviewTouchEnd}
                    onToggleGrid={onToggleGrid}
                    onTogglePreviewBackground={onTogglePreviewBackground}
                  />
                  <div className="w-full flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-[0.6rem] text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300">
                    <span className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
                      Palette
                    </span>
                    <div className="flex flex-col gap-2 px-1 pb-1">
                      <div className="relative flex h-12 overflow-visible rounded-2xl border border-slate-200/80 bg-slate-100/80 shadow-inner dark:border-slate-700/80 dark:bg-slate-950">
                        <div className="flex h-full w-full">
                          {normalizedSegments.map((segment, index) => {
                            const usageLabel = formatPercentage(segment.percentage);
                            const feedbackMatch = paletteFeedback?.color === segment.color;
                            const actionLabel = isEditing ? "Set brush color" : "Copy palette color";
                            return (
                              <button
                                key={`${segment.color}-${index}`}
                                type="button"
                                onClick={() => handlePaletteSegmentAction(segment.color)}
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
                  <a
                    href={resultUrl}
                    download={resultDownloadName}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PNG
                  </a>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                    <svg className="h-8 w-8 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Upload an image and hit <span className="font-medium text-slate-700 dark:text-slate-300">Snap</span> to see results
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {canRestore ? (
          <dialog
            ref={restoreDialogRef}
            className="dialog-shell"
            aria-labelledby="restore-dialog-title"
            aria-describedby="restore-dialog-description"
            onCancel={(event) => {
              event.preventDefault();
              closeRestoreDialog();
            }}
          >
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <p
                  id="restore-dialog-title"
                  className="text-sm font-semibold text-slate-900 dark:text-slate-100"
                >
                  Restore the original image?
                </p>
                <p
                  id="restore-dialog-description"
                  className="text-xs text-slate-500 dark:text-slate-300"
                >
                  This will replace the current edits with the original image.
                </p>
              </div>
              {resultOriginalUrl ? (
                <img
                  src={resultOriginalUrl}
                  alt="Original snap preview"
                  className="max-h-48 w-full rounded-2xl border border-slate-200 bg-white/80 object-contain p-3 dark:border-slate-700 dark:bg-slate-900/70"
                />
              ) : null}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeRestoreDialog}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100"
                >
                  Keep edits
                </button>
                <button
                  type="button"
                  onClick={handleRestoreConfirm}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-rose-600 transition hover:border-rose-300 hover:text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:border-rose-300/70"
                >
                  Restore original
                </button>
              </div>
            </div>
          </dialog>
        ) : null}
        <dialog
          ref={cancelDialogRef}
          className="dialog-shell"
          aria-labelledby="cancel-dialog-title"
          aria-describedby="cancel-dialog-description"
          onCancel={(event) => {
            event.preventDefault();
            closeCancelDialog();
          }}
        >
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <p
                id="cancel-dialog-title"
                className="text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                Discard edits?
              </p>
              <p
                id="cancel-dialog-description"
                className="text-xs text-slate-500 dark:text-slate-300"
              >
                Unsaved strokes will be lost and the panel will revert to the saved result.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeCancelDialog}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-rose-600 transition hover:border-rose-300 hover:text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:border-rose-300/70"
              >
                Discard edits
              </button>
            </div>
          </div>
        </dialog>
      </section>
    </>
  );
});

ResultPanel.displayName = "ResultPanel";

export default ResultPanel;
