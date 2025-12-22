import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import AppFooter from "./components/AppFooter";
import HeroHeader from "./components/HeroHeader";
import HistorySection from "./components/HistorySection";
import ProgressSection from "./components/ProgressSection";
import ResultPanel from "./components/ResultPanel";
import UploadForm from "./components/UploadForm";
import { cx } from "./components/shared";
import type {
  HistoryItem,
  PreviewBackgroundOption,
  ProgressStateKey,
  ProgressStepKey,
  ProgressStepState,
  ProgressTone,
  StatusTone,
} from "./components/types";
import { processImageBlob } from "./pixelSnapper";

type ProgressOverrides = {
  label?: string;
  tone?: ProgressTone;
  steps?: Partial<Record<ProgressStepKey, ProgressStepState>>;
};

const HISTORY_KEY = "pixel-snapper-history";
const ACTIVE_HISTORY_KEY = "pixel-snapper-active";
const HISTORY_LIMIT = 12;
const STATUS_TIMEOUT_MS = 4000;
const PREVIEW_BACKGROUND_KEY = "pixel-snapper-preview-background";
const PREVIEW_GRID_KEY = "pixel-snapper-preview-grid";

const statusClasses: Record<StatusTone, string> = {
  info:
    "border-slate-200 bg-white/80 text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  error:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200",
};

const progressStates: Record<
  ProgressStateKey,
  {
    label: string;
    tone: ProgressTone;
    steps: Record<ProgressStepKey, ProgressStepState>;
  }
> = {
  idle: {
    label: "Awaiting upload",
    tone: "info",
    steps: { upload: "active", queue: "idle", snap: "idle", ready: "idle" },
  },
  ready: {
    label: "Ready to snap",
    tone: "active",
    steps: { upload: "complete", queue: "idle", snap: "idle", ready: "idle" },
  },
  processing: {
    label: "Snapping pixels",
    tone: "active",
    steps: { upload: "complete", queue: "complete", snap: "active", ready: "idle" },
  },
  complete: {
    label: "Download ready",
    tone: "success",
    steps: {
      upload: "complete",
      queue: "complete",
      snap: "complete",
      ready: "complete",
    },
  },
  error: {
    label: "Needs attention",
    tone: "error",
    steps: { upload: "error", queue: "idle", snap: "idle", ready: "idle" },
  },
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toSafeDownloadName = (originalName: string) => {
  if (!originalName || typeof originalName !== "string") {
    return "snapped.png";
  }
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const safeBase = baseName
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  if (!safeBase || safeBase.toLowerCase() === "snapped") {
    return "snapped.png";
  }
  return `snapped-${safeBase}.png`;
};

const toSafeEditName = (originalName: string) => {
  if (!originalName || typeof originalName !== "string") {
    return "edited.png";
  }
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const safeBase = baseName
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  if (!safeBase) {
    return "edited.png";
  }
  return `edited-${safeBase}.png`;
};

const generateRandomSeed = () => {
  const fallback = () => {
    const value = Math.floor(Math.random() * 0x100000000);
    return value === 0 ? 1 : value;
  };

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    const value = buffer[0];
    return value === 0 ? fallback() : value;
  }

  return fallback();
};

const loadPreviewBackgroundPreference = (): PreviewBackgroundOption => {
  if (typeof window === "undefined") {
    return "light";
  }
  try {
    const stored = localStorage.getItem(PREVIEW_BACKGROUND_KEY);
    return stored === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

const loadGridPreference = () => {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return localStorage.getItem(PREVIEW_GRID_KEY) === "true";
  } catch {
    return false;
  }
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(reader.error || new Error("Failed to read image data."));
    reader.readAsDataURL(blob);
  });

const getImageDimensions = async (blob: Blob) => {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return dimensions;
  }

  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image dimensions."));
    };
    image.src = url;
  });
};

const loadHistory = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as HistoryItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item) => item && typeof item.dataUrl === "string")
      .map((item) => ({
        ...item,
        originalDataUrl:
          typeof item.originalDataUrl === "string" ? item.originalDataUrl : item.dataUrl,
      }));
  } catch {
    return [];
  }
};

const saveHistory = (items: HistoryItem[]) => {
  try {
    const sanitized = items.map((item) => {
      if (item.originalDataUrl && item.originalDataUrl === item.dataUrl) {
        const { originalDataUrl: _originalDataUrl, ...rest } = item;
        return rest;
      }
      return item;
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(sanitized));
  } catch {
    // Ignore storage errors.
  }
};

const loadActiveHistoryId = () => {
  try {
    return localStorage.getItem(ACTIVE_HISTORY_KEY);
  } catch {
    return null;
  }
};

const App = () => {
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("info");
  const [isLoading, setIsLoading] = useState(false);
  const [progressState, setProgressState] = useState<ProgressStateKey>("idle");
  const [progressOverrides, setProgressOverrides] = useState<ProgressOverrides>({});
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState("No file selected");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [kColorsValue, setKColorsValue] = useState("16");
  const [kSeedValue, setKSeedValue] = useState("0");
  const [previewBackground, setPreviewBackground] = useState<PreviewBackgroundOption>(
    () => loadPreviewBackgroundPreference()
  );
  const [showPreviewGrid, setShowPreviewGrid] = useState(() => loadGridPreference());
  const resultPanelRef = useRef<HTMLElement>(null);

  const scrollToResultPanel = () => {
    requestAnimationFrame(() => {
      resultPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  useEffect(() => {
    let items = loadHistory();
    if (items.length > HISTORY_LIMIT) {
      items = items.slice(0, HISTORY_LIMIT);
      saveHistory(items);
    }
    setHistoryItems(items);
    const storedActiveId = loadActiveHistoryId();
    const nextActiveId =
      storedActiveId && items.some((item) => item.id === storedActiveId)
        ? storedActiveId
        : items[0]?.id ?? null;
    setActiveHistoryId(nextActiveId);
  }, []);

  useEffect(() => {
    saveHistory(historyItems);
  }, [historyItems]);

  useEffect(() => {
    try {
      if (activeHistoryId) {
        localStorage.setItem(ACTIVE_HISTORY_KEY, activeHistoryId);
      } else {
        localStorage.removeItem(ACTIVE_HISTORY_KEY);
      }
    } catch {
      // Ignore storage errors.
    }
  }, [activeHistoryId]);

  useEffect(() => {
    if (!historyItems.length) {
      if (activeHistoryId) {
        setActiveHistoryId(null);
      }
      return;
    }
    if (!activeHistoryId) {
      return;
    }
    const exists = historyItems.some((item) => item.id === activeHistoryId);
    if (!exists) {
      setActiveHistoryId(historyItems[0]?.id ?? null);
    }
  }, [activeHistoryId, historyItems]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      localStorage.setItem(PREVIEW_BACKGROUND_KEY, previewBackground);
    } catch {
      // Ignore storage errors.
    }
  }, [previewBackground]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      localStorage.setItem(PREVIEW_GRID_KEY, showPreviewGrid ? "true" : "false");
    } catch {
      // Ignore storage errors.
    }
  }, [showPreviewGrid]);

  useEffect(() => {
    return () => {
      if (uploadPreviewUrl) {
        URL.revokeObjectURL(uploadPreviewUrl);
      }
    };
  }, [uploadPreviewUrl]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setStatusMessage("");
    }, STATUS_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [statusMessage]);

  const updateProgress = (state: ProgressStateKey, overrides: ProgressOverrides = {}) => {
    setProgressState(state);
    setProgressOverrides(overrides);
  };

  const setStatus = (message: string, tone: StatusTone = "info") => {
    setStatusMessage(message);
    setStatusTone(tone);
  };

  const setConfigError = (message: string) => {
    setStatus(message, "error");
    updateProgress("error", {
      label: "Fix settings",
      tone: "error",
      steps: { upload: "complete", queue: "idle", snap: "idle", ready: "idle" },
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadFileName(file ? file.name : "No file selected");

    if (file) {
      setUploadPreviewUrl(URL.createObjectURL(file));
    } else {
      setUploadPreviewUrl(null);
    }

    if (!isLoading) {
      updateProgress(file ? "ready" : "idle");
    }
  };

  const pushHistoryItem = (entry: HistoryItem) => {
    setHistoryItems((prev) => [entry, ...prev].slice(0, HISTORY_LIMIT));
    setActiveHistoryId(entry.id);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) {
      return;
    }

    setStatus("");
    setIsLoading(true);

    try {
      if (!selectedFile) {
        setStatus("Pick an image before snapping.", "error");
        updateProgress("error", {
          label: "Image needed",
          tone: "error",
          steps: { upload: "error", queue: "idle", snap: "idle", ready: "idle" },
        });
        return;
      }

      const parsedColors = Number(kColorsValue);
      if (!Number.isInteger(parsedColors)) {
        setConfigError("k_colors must be an integer");
        return;
      }
      if (parsedColors <= 0 || parsedColors > 256) {
        setConfigError("k_colors must be between 1 and 256");
        return;
      }

      const parsedSeed = Number(kSeedValue);
      if (!Number.isInteger(parsedSeed)) {
        setConfigError("k_seed must be an integer");
        return;
      }
      if (parsedSeed < 0) {
        setConfigError("k_seed must be >= 0");
        return;
      }
      const seedForProcessing = parsedSeed === 0 ? generateRandomSeed() : parsedSeed;

      updateProgress("processing");
      const blob = await processImageBlob(selectedFile, {
        kColors: parsedColors,
        kSeed: seedForProcessing,
      });
      if (!blob || blob.size === 0) {
        throw new Error("No output generated. Try a different image.");
      }

      const downloadName = toSafeDownloadName(selectedFile.name);
      let dimensions: { width: number; height: number } | null = null;
      try {
        dimensions = await getImageDimensions(blob);
      } catch {
        dimensions = null;
      }
      const dataUrl = await blobToDataUrl(blob);
      const entry: HistoryItem = {
        id: createId(),
        dataUrl,
        originalDataUrl: dataUrl,
        sourceName: selectedFile.name || "",
        downloadName,
        createdAt: Date.now(),
        width: dimensions?.width,
        height: dimensions?.height,
        kColors: parsedColors,
        kSeed: seedForProcessing,
      };
      pushHistoryItem(entry);
      setStatus("Snapped. Your download is ready.", "success");
      updateProgress("complete");
      scrollToResultPanel();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong. Try a different image.";
      setStatus(message, "error");
      updateProgress("error", {
        label: "Snap failed",
        tone: "error",
        steps: { upload: "complete", queue: "complete", snap: "error", ready: "idle" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditInput = async () => {
    if (isLoading) {
      return;
    }
    if (!selectedFile) {
      setStatus("Pick an image before editing.", "error");
      updateProgress("error", {
        label: "Image needed",
        tone: "error",
        steps: { upload: "error", queue: "idle", snap: "idle", ready: "idle" },
      });
      return;
    }

    setStatus("");
    setIsLoading(true);

    try {
      const dataUrl = await blobToDataUrl(selectedFile);
      let dimensions: { width: number; height: number } | null = null;
      try {
        dimensions = await getImageDimensions(selectedFile);
      } catch {
        dimensions = null;
      }
      const entry: HistoryItem = {
        id: createId(),
        dataUrl,
        originalDataUrl: dataUrl,
        sourceName: selectedFile.name || "",
        downloadName: toSafeEditName(selectedFile.name),
        createdAt: Date.now(),
        width: dimensions?.width,
        height: dimensions?.height,
      };
      pushHistoryItem(entry);
      setStatus("Loaded into the editor. Paint without snapping.", "success");
      updateProgress("ready");
      scrollToResultPanel();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Could not load this image for editing.";
      setStatus(message, "error");
      updateProgress("error", {
        label: "Load failed",
        tone: "error",
        steps: { upload: "complete", queue: "idle", snap: "idle", ready: "idle" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activeResult = useMemo(() => {
    if (!activeHistoryId) {
      return null;
    }
    return historyItems.find((item) => item.id === activeHistoryId) ?? null;
  }, [activeHistoryId, historyItems]);

  const resultDimensions =
    activeResult &&
    typeof activeResult.width === "number" &&
    typeof activeResult.height === "number"
      ? { width: activeResult.width, height: activeResult.height }
      : null;

  const hasEdits =
    Boolean(activeResult?.originalDataUrl) &&
    activeResult?.dataUrl !== activeResult?.originalDataUrl;

  const handleCommitEdits = (dataUrl: string) => {
    if (!activeHistoryId) {
      return;
    }
    setHistoryItems((prev) =>
      prev.map((item) =>
        item.id === activeHistoryId
          ? {
              ...item,
              dataUrl,
              originalDataUrl: item.originalDataUrl ?? item.dataUrl,
            }
          : item
      )
    );
  };

  const handleDiscardEdits = () => {
    if (!activeHistoryId) {
      return;
    }
    setHistoryItems((prev) =>
      prev.map((item) =>
        item.id === activeHistoryId
          ? { ...item, dataUrl: item.originalDataUrl ?? item.dataUrl }
          : item
      )
    );
  };

  const handleClearSelection = () => {
    setActiveHistoryId(null);
    setStatus("Selection cleared.", "info");
  };

  const handleSelectHistory = (id: string) => {
    setActiveHistoryId(id);
    setStatus("History entry loaded into the editor.", "info");
    scrollToResultPanel();
  };

  const handleClearHistory = () => {
    setHistoryItems([]);
    setActiveHistoryId(null);
    setStatus("History cleared.", "info");
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
    setStatus("History entry deleted.", "info");
    setActiveHistoryId((prev) => (prev === id ? null : prev));
  };

  const togglePreviewBackground = () => {
    setPreviewBackground((prev) => (prev === "light" ? "dark" : "light"));
  };

  const togglePreviewGrid = () => {
    setShowPreviewGrid((prev) => !prev);
  };

  const progressConfig = progressStates[progressState];
  const progressLabel = progressOverrides.label ?? progressConfig.label;
  const progressTone = progressOverrides.tone ?? progressConfig.tone;
  const progressSteps = useMemo(
    () => ({ ...progressConfig.steps, ...(progressOverrides.steps || {}) }),
    [progressConfig.steps, progressOverrides.steps]
  );

  const statusClassName = cx(
    "fixed bottom-6 left-1/2 z-30 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border px-4 py-3 pr-10 text-sm font-semibold shadow-lg backdrop-blur",
    !statusMessage && "hidden",
    statusClasses[statusTone]
  );

  const uploadPreviewAlt = selectedFile
    ? selectedFile.name
      ? `Uploaded ${selectedFile.name}`
      : "Uploaded image"
    : "";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,171,102,0.55),transparent_55%),radial-gradient(circle_at_80%_25%,rgba(88,150,255,0.45),transparent_50%),radial-gradient(circle_at_10%_90%,rgba(237,91,133,0.35),transparent_40%)] dark:bg-[radial-gradient(circle_at_top,rgba(30,41,59,0.95),transparent_60%),radial-gradient(circle_at_80%_25%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(circle_at_10%_90%,rgba(248,113,113,0.16),transparent_45%)]"></div>
      <div className="pointer-events-none absolute inset-0 opacity-40 pixel-grid"></div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 pb-16 pt-12">
        <HeroHeader />

        <ProgressSection
          label={progressLabel}
          tone={progressTone}
          steps={progressSteps}
        />

        <section className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <UploadForm
            isLoading={isLoading}
            canEditInput={Boolean(selectedFile)}
            uploadFileName={uploadFileName}
            uploadPreviewUrl={uploadPreviewUrl}
            uploadPreviewAlt={uploadPreviewAlt}
            kColorsValue={kColorsValue}
            kSeedValue={kSeedValue}
            onSubmit={handleSubmit}
            onFileChange={handleFileChange}
            onKColorsChange={setKColorsValue}
            onKSeedChange={setKSeedValue}
            onEditInput={handleEditInput}
          />

        <ResultPanel
          ref={resultPanelRef}
          resultId={activeResult?.id ?? null}
          resultUrl={activeResult?.dataUrl ?? null}
          resultOriginalUrl={activeResult?.originalDataUrl ?? null}
          resultDownloadName={activeResult?.downloadName ?? "snapped.png"}
          resultDimensions={resultDimensions}
          hasEdits={hasEdits}
          onCommitEdits={handleCommitEdits}
          onDiscardEdits={handleDiscardEdits}
          showGrid={showPreviewGrid}
          previewBackground={previewBackground}
          onToggleGrid={togglePreviewGrid}
          onTogglePreviewBackground={togglePreviewBackground}
          onClearSelection={handleClearSelection}
        />
        </section>

        <HistorySection
          items={historyItems}
          activeId={activeHistoryId}
          onSelect={handleSelectHistory}
          onClearHistory={handleClearHistory}
          onDeleteItem={handleDeleteHistoryItem}
          previewBackground={previewBackground}
        />

        <AppFooter />
      </main>

      <div id="status" className={statusClassName} aria-live="polite">
        <span>{statusMessage}</span>
        <button
          type="button"
          className="absolute right-3 top-3 text-lg leading-none text-slate-500 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          aria-label="Dismiss status message"
          onClick={() => setStatusMessage("")}
        >
          X
        </button>
        <span
          aria-hidden="true"
          className="toast-timer"
          style={{ animationDuration: `${STATUS_TIMEOUT_MS}ms` }}
        />
      </div>
    </div>
  );
};

export default App;
