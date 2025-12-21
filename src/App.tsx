import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type StatusTone = "info" | "success" | "error";
type ProgressTone = "info" | "active" | "success" | "error";
type ProgressStepKey = "upload" | "queue" | "snap" | "ready";
type ProgressStepState = "idle" | "active" | "complete" | "error";
type ProgressStateKey = "idle" | "ready" | "processing" | "complete" | "error";
type PreviewScale = "1" | "2" | "3";

type HistoryItem = {
  id: string;
  dataUrl: string;
  sourceName: string;
  downloadName: string;
  createdAt: number;
};

type ProgressOverrides = {
  label?: string;
  tone?: ProgressTone;
  steps?: Partial<Record<ProgressStepKey, ProgressStepState>>;
};

const HISTORY_KEY = "pixel-snapper-history";
const HISTORY_LIMIT = 12;

const statusClasses: Record<StatusTone, string> = {
  info: "border-slate-200 bg-white/80 text-slate-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const progressStatusClasses: Record<ProgressTone, string> = {
  info: "border-slate-200 bg-white/80 text-slate-600",
  active: "border-slate-900 bg-slate-900 text-white",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const progressStepClasses: Record<ProgressStepState, string> = {
  idle: "border-slate-200 bg-white/70 text-slate-500",
  active:
    "border-slate-900 bg-slate-900 text-white shadow-[0_12px_30px_-20px_rgba(15,23,42,0.85)]",
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const progressStates: Record<ProgressStateKey, {
  label: string;
  tone: ProgressTone;
  steps: Record<ProgressStepKey, ProgressStepState>;
}> = {
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
    label: "Processing",
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

const previewScaleClasses = {
  active:
    "border-slate-900 bg-slate-900 text-white shadow-[0_8px_20px_-12px_rgba(15,23,42,0.8)]",
  inactive:
    "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-400 hover:text-slate-900",
};

const previewScaleOptions: PreviewScale[] = ["1", "2", "3"];

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

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

const formatTimestamp = (value: number) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString();
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

  const addHistoryItem = async (blob: Blob, sourceName: string, downloadName: string) => {
    try {
      const dataUrl = await blobToDataUrl(blob);
      const entry: HistoryItem = {
        id: createId(),
        dataUrl,
        sourceName: sourceName || "",
        downloadName: downloadName || "snapped.png",
        createdAt: Date.now(),
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
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("k_colors", String(parsedColors));
      formData.append("k_seed", String(parsedSeed));

      const response = await fetch("/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message || "Something went wrong. Try a different image."
        );
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error("Empty response from the server.");
      }

      const nextUrl = URL.createObjectURL(blob);
      setResultUrl(nextUrl);
      const downloadName = toSafeDownloadName(selectedFile.name);
      setResultDownloadName(downloadName);
      void addHistoryItem(blob, selectedFile.name, downloadName);
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,171,102,0.55),_transparent_55%),radial-gradient(circle_at_80%_25%,_rgba(88,150,255,0.45),_transparent_50%),radial-gradient(circle_at_10%_90%,_rgba(237,91,133,0.35),_transparent_40%)]"></div>
      <div className="pointer-events-none absolute inset-0 opacity-40 pixel-grid"></div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 pb-16 pt-12">
        <header className="flex flex-col gap-6 reveal" style={{ animationDelay: "80ms" }}>
          <div className="flex flex-wrap items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1">Pixel Lab</span>
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1">Vite + Tailwind 4</span>
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1">TSX</span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-5">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Pixel Snapper
                <span className="block text-slate-500">Snap noisy art into a clean grid.</span>
              </h1>
              <p className="max-w-xl text-base text-slate-600 sm:text-lg">
                Upload a source image, pick your palette size, and get a crisp pixel-perfect render with strict grid alignment.
              </p>
            </div>
            <div className="glass-card flex flex-col gap-4 rounded-3xl p-6">
              <div className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">How it works</div>
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-900"></span>
                  Cluster colors with K-means so the palette stays tight.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-900"></span>
                  Snap every pixel onto a grid to remove jitter.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-900"></span>
                  Download the cleaned PNG with no extra clicks.
                </li>
              </ol>
            </div>
          </div>
        </header>

        <section className="glass-card flex flex-col gap-4 rounded-3xl p-6 reveal" style={{ animationDelay: "140ms" }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Progress</h2>
              <p className="text-sm text-slate-500">A quick pulse while the snap runs.</p>
            </div>
            <span
              id="progress-status"
              className={cx(
                "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
                progressStatusClasses[progressTone]
              )}
              aria-live="polite"
            >
              {progressLabel}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div
              id="progress-step-upload"
              className={cx(
                "flex items-center gap-4 rounded-2xl border px-4 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition",
                progressStepClasses[progressSteps.upload]
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-current/20 bg-current/10">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M12 16V6" />
                  <path d="M8 10l4-4 4 4" />
                  <path d="M4 18h16" />
                </svg>
              </div>
              <span>Upload</span>
            </div>
            <div
              id="progress-step-queue"
              className={cx(
                "flex items-center gap-4 rounded-2xl border px-4 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition",
                progressStepClasses[progressSteps.queue]
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-current/20 bg-current/10">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M4 7h16" />
                  <path d="M4 12h10" />
                  <path d="M4 17h6" />
                </svg>
              </div>
              <span>Queue</span>
            </div>
            <div
              id="progress-step-snap"
              className={cx(
                "flex items-center gap-4 rounded-2xl border px-4 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition",
                progressStepClasses[progressSteps.snap]
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-current/20 bg-current/10">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <rect x="4" y="4" width="6" height="6" />
                  <rect x="14" y="4" width="6" height="6" />
                  <rect x="4" y="14" width="6" height="6" />
                  <rect x="14" y="14" width="6" height="6" />
                </svg>
              </div>
              <span>Snap</span>
            </div>
            <div
              id="progress-step-ready"
              className={cx(
                "flex items-center gap-4 rounded-2xl border px-4 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition",
                progressStepClasses[progressSteps.ready]
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-current/20 bg-current/10">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Ready</span>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <form
            id="snap-form"
            className={cx(
              "glass-card flex flex-col gap-6 rounded-3xl p-6 reveal",
              isLoading && "opacity-60"
            )}
            style={{ animationDelay: "140ms" }}
            aria-busy={isLoading ? "true" : "false"}
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Upload + tune</h2>
                <p className="text-sm text-slate-500">Drop your art and dial in the palette.</p>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">Step 1</span>
            </div>

            <label className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 px-5 py-6 text-sm transition hover:border-slate-500">
              <input
                id="image-input"
                type="file"
                name="image"
                accept="image/*"
                required
                className="sr-only"
                onChange={handleFileChange}
              />
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">Image</span>
              <span className="text-base font-semibold text-slate-900">Drop a file or click to browse</span>
              <span id="file-name" className="font-[var(--font-mono)] text-xs text-slate-500">{uploadFileName}</span>
              {uploadPreviewUrl ? (
                <img
                  id="upload-preview"
                  className="pixelated mt-3 max-h-[240px] w-full object-contain p-3"
                  src={uploadPreviewUrl}
                  alt={uploadPreviewAlt}
                />
              ) : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
                <span>Palette size</span>
                <input
                  type="number"
                  name="k_colors"
                  min="1"
                  max="256"
                  value={kColorsValue}
                  onChange={(event) => setKColorsValue(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
                <span className="text-xs font-normal text-slate-500">1 to 256 colors.</span>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
                <span>Seed</span>
                <input
                  type="number"
                  name="k_seed"
                  min="0"
                  value={kSeedValue}
                  onChange={(event) => setKSeedValue(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
                <span className="text-xs font-normal text-slate-500">Keep results deterministic.</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button id="snap-button" type="submit" className="btn-primary" disabled={isLoading}>
                Snap pixels
              </button>
              <div
                id="busy"
                className={cx(
                  "items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500",
                  !isLoading && "hidden"
                )}
              >
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500"></span>
                Processing
              </div>
            </div>

            <div id="status" className={statusClassName} aria-live="polite">
              {statusMessage}
            </div>
          </form>

          <section className="glass-card flex flex-col gap-5 rounded-3xl p-6 reveal" style={{ animationDelay: "220ms" }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Result</h2>
                <p className="text-sm text-slate-500">PNG preview with crisp grid edges.</p>
              </div>
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 2</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400">Preview scale</span>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 p-1">
                {previewScaleOptions.map((value) => {
                  const isActive = previewScale === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      data-preview-scale={value}
                      onClick={() => setPreviewScale(value)}
                      aria-pressed={isActive}
                      className={cx(
                        "rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] shadow-sm",
                        isActive ? previewScaleClasses.active : previewScaleClasses.inactive
                      )}
                    >
                      {value}x
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div
                id="result"
                data-preview-scale={previewScale}
                className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500"
                aria-live="polite"
              >
                {resultUrl ? (
                  <>
                    <div className="preview-viewport relative p-4 sm:p-6">
                      <div className="preview-stage">
                        <img src={resultUrl} alt="Snapped result" className="preview-image pixelated" />
                      </div>
                    </div>
                    <a
                      href={resultUrl}
                      download={resultDownloadName}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
                    >
                      Download {resultDownloadName}
                    </a>
                  </>
                ) : (
                  <>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400">Awaiting</span>
                    <p>Upload an image and hit Snap.</p>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-xs text-slate-500">
              Tip: AI pixel outputs snap best when they are slightly oversized.
            </div>
          </section>
        </section>

        <section className="glass-card flex flex-col gap-5 rounded-3xl p-6 reveal" style={{ animationDelay: "260ms" }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">History</h2>
              <p className="text-sm text-slate-500">Saved locally for quick downloads.</p>
            </div>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Local</span>
          </div>

          <div id="history" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            {historyItems.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400">No history yet</span>
                <p>Snapped images saved here for quick download.</p>
              </div>
            ) : (
              historyItems.map((item) => {
                const timestamp = formatTimestamp(item.createdAt);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm"
                  >
                    <img
                      src={item.dataUrl}
                      alt={item.sourceName ? `Snapped ${item.sourceName}` : "Snapped image"}
                      loading="lazy"
                      className="pixelated h-36 w-full rounded-xl border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.04),rgba(148,163,184,0.08))] object-contain p-3"
                    />
                    <div className="flex flex-col gap-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {item.downloadName || item.sourceName || "Snapped image"}
                      </span>
                      {timestamp ? <span>{timestamp}</span> : null}
                      {item.sourceName ? <span>Source: {item.sourceName}</span> : null}
                    </div>
                    <a
                      href={item.dataUrl}
                      download={item.downloadName || "snapped.png"}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
                    >
                      Download
                    </a>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <footer className="flex flex-col gap-2 text-xs text-slate-500 reveal" style={{ animationDelay: "320ms" }}>
          <span className="font-semibold uppercase tracking-[0.3em] text-slate-400">Pixel Snapper</span>
          <span>Made for clean edges, crunchy dithers, and deliberate palettes.</span>
        </footer>
      </main>
    </div>
  );
};

export default App;
