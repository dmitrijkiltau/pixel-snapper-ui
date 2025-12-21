import { useEffect, useMemo, useState } from "react";
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
  ProgressStateKey,
  ProgressStepKey,
  ProgressStepState,
  ProgressTone,
  PreviewScale,
  StatusTone,
} from "./components/types";
import { processImageBlob } from "./pixelSnapper";

type ProgressOverrides = {
  label?: string;
  tone?: ProgressTone;
  steps?: Partial<Record<ProgressStepKey, ProgressStepState>>;
};

const HISTORY_KEY = "pixel-snapper-history";
const HISTORY_LIMIT = 12;

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
    return parsed.filter((item) => item && typeof item.dataUrl === "string");
  } catch {
    return [];
  }
};

const saveHistory = (items: HistoryItem[]) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors.
  }
};

const App = () => {
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("info");
  const [isLoading, setIsLoading] = useState(false);
  const [progressState, setProgressState] = useState<ProgressStateKey>("idle");
  const [progressOverrides, setProgressOverrides] = useState<ProgressOverrides>({});
  const [previewScale, setPreviewScale] = useState<PreviewScale>("1");
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState("No file selected");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultDownloadName, setResultDownloadName] = useState("snapped.png");
  const [resultDimensions, setResultDimensions] = useState<{ width: number; height: number } | null>(
    null
  );
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [kColorsValue, setKColorsValue] = useState("16");
  const [kSeedValue, setKSeedValue] = useState("42");

  useEffect(() => {
    let items = loadHistory();
    if (items.length > HISTORY_LIMIT) {
      items = items.slice(0, HISTORY_LIMIT);
      saveHistory(items);
    }
    setHistoryItems(items);
  }, []);

  useEffect(() => {
    saveHistory(historyItems);
  }, [historyItems]);

  useEffect(() => {
    return () => {
      if (uploadPreviewUrl) {
        URL.revokeObjectURL(uploadPreviewUrl);
      }
    };
  }, [uploadPreviewUrl]);

  useEffect(() => {
    return () => {
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [resultUrl]);

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

  const addHistoryItem = async (
    blob: Blob,
    sourceName: string,
    downloadName: string,
    meta: { width?: number; height?: number; kColors: number; kSeed: number }
  ) => {
    try {
      const dataUrl = await blobToDataUrl(blob);
      const entry: HistoryItem = {
        id: createId(),
        dataUrl,
        sourceName: sourceName || "",
        downloadName: downloadName || "snapped.png",
        createdAt: Date.now(),
        width: meta.width,
        height: meta.height,
        kColors: meta.kColors,
        kSeed: meta.kSeed,
      };
      setHistoryItems((prev) => [entry, ...prev].slice(0, HISTORY_LIMIT));
    } catch {
      // Ignore history write errors.
    }
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

      updateProgress("processing");
      const blob = await processImageBlob(selectedFile, {
        kColors: parsedColors,
        kSeed: parsedSeed,
      });
      if (!blob || blob.size === 0) {
        throw new Error("No output generated. Try a different image.");
      }

      const downloadName = toSafeDownloadName(selectedFile.name);
      const nextUrl = URL.createObjectURL(blob);
      setResultUrl(nextUrl);
      setResultDownloadName(downloadName);
      let dimensions: { width: number; height: number } | null = null;
      try {
        dimensions = await getImageDimensions(blob);
      } catch {
        dimensions = null;
      }
      setResultDimensions(dimensions);
      void addHistoryItem(blob, selectedFile.name, downloadName, {
        width: dimensions?.width,
        height: dimensions?.height,
        kColors: parsedColors,
        kSeed: parsedSeed,
      });
      setStatus("Snapped. Your download is ready.", "success");
      updateProgress("complete");
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

  const progressConfig = progressStates[progressState];
  const progressLabel = progressOverrides.label ?? progressConfig.label;
  const progressTone = progressOverrides.tone ?? progressConfig.tone;
  const progressSteps = useMemo(
    () => ({ ...progressConfig.steps, ...(progressOverrides.steps || {}) }),
    [progressConfig.steps, progressOverrides.steps]
  );
  const progressDetails = useMemo(() => {
    const snapConfig = `${kColorsValue} colors, seed ${kSeedValue}`;
    const uploadDetail =
      progressSteps.upload === "error"
        ? "Image required"
        : selectedFile
          ? "Image locked in"
          : "Choose an image to begin";
    const queueDetail =
      progressSteps.queue === "complete"
        ? "Settings verified"
        : progressSteps.queue === "active"
          ? "Checking palette settings"
          : progressSteps.queue === "error"
            ? "Fix palette settings"
            : "Waiting on upload";
    const snapDetail =
      progressSteps.snap === "complete"
        ? `Snapped at ${snapConfig}`
        : progressSteps.snap === "active"
          ? `Snapping to ${snapConfig}`
          : progressSteps.snap === "error"
            ? "Snap failed. Check settings."
            : `Ready for ${snapConfig}`;
    const readyDetail =
      progressSteps.ready === "complete"
        ? "Download ready"
        : progressSteps.ready === "active"
          ? "Packaging download"
          : progressSteps.ready === "error"
            ? "Download failed"
            : "Awaiting snap";

    return {
      upload: uploadDetail,
      queue: queueDetail,
      snap: snapDetail,
      ready: readyDetail,
    };
  }, [
    kColorsValue,
    kSeedValue,
    progressSteps.queue,
    progressSteps.ready,
    progressSteps.snap,
    progressSteps.upload,
    selectedFile,
  ]);

  const statusClassName = cx(
    "rounded-2xl border px-4 py-3 text-sm font-semibold",
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,171,102,0.55),_transparent_55%),radial-gradient(circle_at_80%_25%,_rgba(88,150,255,0.45),_transparent_50%),radial-gradient(circle_at_10%_90%,_rgba(237,91,133,0.35),_transparent_40%)] dark:bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.95),_transparent_60%),radial-gradient(circle_at_80%_25%,_rgba(56,189,248,0.2),_transparent_55%),radial-gradient(circle_at_10%_90%,_rgba(248,113,113,0.16),_transparent_45%)]"></div>
      <div className="pointer-events-none absolute inset-0 opacity-40 pixel-grid"></div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 pb-16 pt-12">
        <HeroHeader />

        <ProgressSection
          label={progressLabel}
          tone={progressTone}
          steps={progressSteps}
          details={progressDetails}
        />

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <UploadForm
            isLoading={isLoading}
            uploadFileName={uploadFileName}
            uploadPreviewUrl={uploadPreviewUrl}
            uploadPreviewAlt={uploadPreviewAlt}
            kColorsValue={kColorsValue}
            kSeedValue={kSeedValue}
            statusClassName={statusClassName}
            statusMessage={statusMessage}
            onSubmit={handleSubmit}
            onFileChange={handleFileChange}
            onKColorsChange={setKColorsValue}
            onKSeedChange={setKSeedValue}
          />

          <ResultPanel
            resultUrl={resultUrl}
            resultDownloadName={resultDownloadName}
            resultDimensions={resultDimensions}
            previewScale={previewScale}
            onPreviewScaleChange={setPreviewScale}
          />
        </section>

        <HistorySection items={historyItems} />

        <AppFooter />
      </main>
    </div>
  );
};

export default App;
