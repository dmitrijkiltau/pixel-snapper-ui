import { useEffect, useReducer, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { cx, SectionHeader, StepPill } from "./shared";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 6;
const PALETTE_SIZE = 10;

const IconUndo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
    <path d="M4 7H15C16.8692 7 17.8039 7 18.5 7.40193C18.9561 7.66523 19.3348 8.04394 19.5981 8.49999C20 9.19615 20 10.1308 20 12C20 13.8692 20 14.8038 19.5981 15.5C19.3348 15.9561 18.9561 16.3348 18.5 16.5981C17.8039 17 16.8692 17 15 17H8.00001M4 7L7 4M4 7L7 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
);

const IconRedo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
    <path d="M20 7H9.00001C7.13077 7 6.19615 7 5.5 7.40193C5.04395 7.66523 4.66524 8.04394 4.40193 8.49999C4 9.19615 4 10.1308 4 12C4 13.8692 4 14.8038 4.40192 15.5C4.66523 15.9561 5.04394 16.3348 5.5 16.5981C6.19615 17 7.13077 17 9 17H16M20 7L17 4M20 7L17 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
);

const IconMoreVertical = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
);

const IconHelp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
    <path d="M12 17V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="1" cy="1" r="1" transform="matrix(1 0 0 -1 11 9)" fill="currentColor"/>
    <path d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" stroke="currentColor" stroke-width="1.5"/>
  </svg>
);

const IconPaint = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
    <path d="M14.3601 4.07866L15.2869 3.15178C16.8226 1.61607 19.3125 1.61607 20.8482 3.15178C22.3839 4.68748 22.3839 7.17735 20.8482 8.71306L19.9213 9.63993M14.3601 4.07866C14.3601 4.07866 14.4759 6.04828 16.2138 7.78618C17.9517 9.52407 19.9213 9.63993 19.9213 9.63993M14.3601 4.07866L5.83882 12.5999C5.26166 13.1771 4.97308 13.4656 4.7249 13.7838C4.43213 14.1592 4.18114 14.5653 3.97634 14.995C3.80273 15.3593 3.67368 15.7465 3.41556 16.5208L2.32181 19.8021M19.9213 9.63993L11.4001 18.1612C10.8229 18.7383 10.5344 19.0269 10.2162 19.2751C9.84082 19.5679 9.43469 19.8189 9.00498 20.0237C8.6407 20.1973 8.25352 20.3263 7.47918 20.5844L4.19792 21.6782M4.19792 21.6782L3.39584 21.9456C3.01478 22.0726 2.59466 21.9734 2.31063 21.6894C2.0266 21.4053 1.92743 20.9852 2.05445 20.6042L2.32181 19.8021M4.19792 21.6782L2.32181 19.8021" stroke="currentColor" stroke-width="1.5"/>
  </svg>
);

const IconErase = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
    <path d="M5.50506 11.4096L6.03539 11.9399L5.50506 11.4096ZM3 14.9522H2.25H3ZM9.04776 21V21.75V21ZM11.4096 5.50506L10.8792 4.97473L11.4096 5.50506ZM13.241 17.8444C13.5339 18.1373 14.0088 18.1373 14.3017 17.8444C14.5946 17.5515 14.5946 17.0766 14.3017 16.7837L13.241 17.8444ZM7.21629 9.69832C6.9234 9.40543 6.44852 9.40543 6.15563 9.69832C5.86274 9.99122 5.86274 10.4661 6.15563 10.759L7.21629 9.69832ZM17.9646 12.0601L12.0601 17.9646L13.1208 19.0253L19.0253 13.1208L17.9646 12.0601ZM6.03539 11.9399L11.9399 6.03539L10.8792 4.97473L4.97473 10.8792L6.03539 11.9399ZM6.03539 17.9646C5.18538 17.1146 4.60235 16.5293 4.22253 16.0315C3.85592 15.551 3.75 15.2411 3.75 14.9522H2.25C2.25 15.701 2.56159 16.3274 3.03 16.9414C3.48521 17.538 4.1547 18.2052 4.97473 19.0253L6.03539 17.9646ZM4.97473 10.8792C4.1547 11.6993 3.48521 12.3665 3.03 12.9631C2.56159 13.577 2.25 14.2035 2.25 14.9522H3.75C3.75 14.6633 3.85592 14.3535 4.22253 13.873C4.60235 13.3752 5.18538 12.7899 6.03539 11.9399L4.97473 10.8792ZM12.0601 17.9646C11.2101 18.8146 10.6248 19.3977 10.127 19.7775C9.64651 20.1441 9.33665 20.25 9.04776 20.25V21.75C9.79649 21.75 10.423 21.4384 11.0369 20.97C11.6335 20.5148 12.3008 19.8453 13.1208 19.0253L12.0601 17.9646ZM4.97473 19.0253C5.79476 19.8453 6.46201 20.5148 7.05863 20.97C7.67256 21.4384 8.29902 21.75 9.04776 21.75V20.25C8.75886 20.25 8.449 20.1441 7.9685 19.7775C7.47069 19.3977 6.88541 18.8146 6.03539 17.9646L4.97473 19.0253ZM17.9646 6.03539C18.8146 6.88541 19.3977 7.47069 19.7775 7.9685C20.1441 8.449 20.25 8.75886 20.25 9.04776H21.75C21.75 8.29902 21.4384 7.67256 20.97 7.05863C20.5148 6.46201 19.8453 5.79476 19.0253 4.97473L17.9646 6.03539ZM19.0253 13.1208C19.8453 12.3008 20.5148 11.6335 20.97 11.0369C21.4384 10.423 21.75 9.79649 21.75 9.04776H20.25C20.25 9.33665 20.1441 9.64651 19.7775 10.127C19.3977 10.6248 18.8146 11.2101 17.9646 12.0601L19.0253 13.1208ZM19.0253 4.97473C18.2052 4.1547 17.538 3.48521 16.9414 3.03C16.3274 2.56159 15.701 2.25 14.9522 2.25V3.75C15.2411 3.75 15.551 3.85592 16.0315 4.22253C16.5293 4.60235 17.1146 5.18538 17.9646 6.03539L19.0253 4.97473ZM11.9399 6.03539C12.7899 5.18538 13.3752 4.60235 13.873 4.22253C14.3535 3.85592 14.6633 3.75 14.9522 3.75V2.25C14.2035 2.25 13.577 2.56159 12.9631 3.03C12.3665 3.48521 11.6993 4.1547 10.8792 4.97473L11.9399 6.03539ZM14.3017 16.7837L7.21629 9.69832L6.15563 10.759L13.241 17.8444L14.3017 16.7837Z" fill="currentColor"/>
    <path d="M9 21H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
);

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const toHex = (value: number) => value.toString(16).padStart(2, "0");

const normalizePalette = (colors: string[], size: number, fallback: string) => {
  const next = colors.slice(0, size);
  while (next.length < size) {
    next.push(fallback);
  }
  return next;
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
  onRemoveResult: () => void;
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
  resultOriginalUrl,
  resultDownloadName,
  resultDimensions,
  hasEdits,
  onCommitEdits,
  onDiscardEdits,
  onRemoveResult,
}: ResultPanelProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTool, setEditTool] = useState<"paint" | "erase">("paint");
  const [brushColor, setBrushColor] = useState("#0f172a");
  const [palette, setPalette] = useState<string[]>(
    Array.from({ length: PALETTE_SIZE }, () => "#0f172a")
  );
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
  const restoreDialogRef = useRef<HTMLDialogElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<DragState | null>(null);
  const paintState = useRef<PaintState | null>(null);
  const lastLoadedUrlRef = useRef<string | null>(null);
  const shouldCenterRef = useRef(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
    setIsEditing(false);
    setIsPainting(false);
    setHasPendingEdits(false);
    setPalette(Array.from({ length: PALETTE_SIZE }, () => "#0f172a"));
    setShowHelp(false);
    setShowMoreMenu(false);
    dragState.current = null;
    paintState.current = null;
    lastLoadedUrlRef.current = null;
    shouldCenterRef.current = true;
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
  const canRestore = hasEdits && Boolean(resultOriginalUrl);

  function extractPaletteFromCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return [];
    }
    const { width, height } = canvas;
    if (!width || !height) {
      return [];
    }
    const data = ctx.getImageData(0, 0, width, height).data;
    const counts = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) {
        continue;
      }
      const hex = `#${toHex(data[i])}${toHex(data[i + 1])}${toHex(data[i + 2])}`;
      counts.set(hex, (counts.get(hex) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, PALETTE_SIZE)
      .map(([hex]) => hex);
  }

  function refreshPaletteFromCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const extracted = extractPaletteFromCanvas(canvas);
    setPalette((prev) =>
      normalizePalette(extracted, PALETTE_SIZE, prev[0] ?? brushColor)
    );
  }

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
    refreshPaletteFromCanvas();
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

  const copyPaletteColor = async (color: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(color);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = color;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasResult) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0 && event.button !== 2) {
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
    handleDiscard();
    closeRestoreDialog();
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
        <div className="flex items-center gap-2">
          {dimensionLabel ? (
            <span className="tag-pill">{dimensionLabel}</span>
          ) : null}
          {hasEdits ? <span className="tag-pill bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">Edited</span> : null}
        </div>
        {hasResult ? (
          <button
            type="button"
            onClick={() => setShowHelp((prev) => !prev)}
            className={cx(
              "inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] font-medium transition",
              showHelp
                ? "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                : "border-slate-200 bg-white/80 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300"
            )}
            aria-pressed={showHelp}
            aria-label="Toggle help"
          >
            <IconHelp />
            <span>Help</span>
          </button>
        ) : null}
      </div>

      {showHelp && hasResult ? (
        <div className="flex flex-wrap gap-2 text-[0.6rem] text-slate-500 dark:text-slate-400">
          <span className="tag-pill">Scroll to zoom</span>
          <span className="tag-pill">Right-click or drag to pan</span>
          {isEditing ? (
            <>
              <span className="tag-pill">Click to {editTool === "erase" ? "erase" : "paint"}</span>
              <span className="tag-pill">Alt+click to sample color</span>
            </>
          ) : null}
        </div>
      ) : null}

      {hasResult ? (
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary action: Edit toggle */}
          <button
            type="button"
            onClick={handleToggleEdit}
            className={cx(
              "inline-flex items-center justify-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] transition",
              isEditing
                ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
            )}
            aria-pressed={isEditing}
          >
            {isEditing ? "Done" : "Edit"}
          </button>

          {/* Editing tools - only shown when editing */}
          {isEditing ? (
            <>
              {/* Divider */}
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
              
              {/* Tool selection */}
              <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setEditTool("paint")}
                  className={cx(
                    "inline-flex items-center justify-center rounded-full p-1.5 transition",
                    editTool === "paint"
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                  aria-pressed={editTool === "paint"}
                  aria-label="Paint tool"
                >
                  <IconPaint />
                </button>
                <button
                  type="button"
                  onClick={() => setEditTool("erase")}
                  className={cx(
                    "inline-flex items-center justify-center rounded-full p-1.5 transition",
                    editTool === "erase"
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                  aria-pressed={editTool === "erase"}
                  aria-label="Erase tool"
                >
                  <IconErase />
                </button>
              </div>

              {/* Brush color */}
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(event) => setBrushColor(event.target.value)}
                  className="h-5 w-5 cursor-pointer rounded-full p-0"
                  aria-label="Brush color"
                />
              </div>

              {/* Undo/Redo */}
              <div className="flex items-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!canUndo || isPainting}
                  className="inline-flex items-center justify-center rounded-l-full px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 dark:disabled:text-slate-600"
                  aria-label="Undo"
                >
                  <IconUndo />
                </button>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={!canRedo || isPainting}
                  className="inline-flex items-center justify-center rounded-r-full px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 dark:disabled:text-slate-600"
                  aria-label="Redo"
                >
                  <IconRedo />
                </button>
              </div>
            </>
          ) : null}

          {/* Spacer */}
          <div className="flex-1" />

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
              <div className="absolute right-0 top-full z-10 mt-1 min-w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                {hasEdits ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      openRestoreDialog();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Restore original
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onRemoveResult();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  Remove result
                </button>
              </div>
            ) : null}
          </div>
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
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-[0.6rem] text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300">
                <span className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
                  Palette
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {palette.map((color, index) => {
                    if (!isEditing) {
                      return (
                        <button
                          key={`${color}-${index}`}
                          type="button"
                          onClick={() => copyPaletteColor(color)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-[0.55rem] font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                          aria-label={`Copy palette color ${color}`}
                          title="Copy hex"
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-slate-200 dark:border-slate-700"
                            style={{ backgroundColor: color }}
                          />
                          <span>{color}</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={`${color}-${index}`}
                        type="button"
                        onClick={() => setBrushColor(color)}
                        className={cx(
                          "h-7 w-7 rounded-md border transition",
                          brushColor.toLowerCase() === color.toLowerCase()
                            ? "border-slate-900 ring-2 ring-slate-900/20 dark:border-slate-100 dark:ring-slate-100/20"
                            : "border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-400"
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Select palette color ${index + 1}`}
                        title={`Select ${color}`}
                      />
                    );
                  })}
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

      <div className="flex items-start gap-2 rounded-xl border border-slate-200/60 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/30 dark:text-slate-400">
        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <span>AI pixel outputs snap best when they are slightly oversized.</span>
      </div>

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
    </section>
  );
};

export default ResultPanel;
