import "./main.css";
import dom from "@klt/dom-js";
import { http } from "@klt/dom-js/http";

const api = http.withThrowOnError();

const $form = dom("#snap-form");
const $submit = dom("#snap-button");
const $busy = dom("#busy");
const $status = dom("#status");
const $result = dom("#result");
const $uploadPreview = dom("#upload-preview");
const $history = dom("#history");
const $fileInput = dom("#image-input");
const $fileName = dom("#file-name");
const $progressStatus = dom("#progress-status");
const $progressStepUpload = dom("#progress-step-upload");
const $progressStepQueue = dom("#progress-step-queue");
const $progressStepSnap = dom("#progress-step-snap");
const $progressStepReady = dom("#progress-step-ready");
const previewScaleButtons = Array.from(
  document.querySelectorAll("button[data-preview-scale]")
);

const statusClasses = {
  info: "border-slate-200 bg-white/80 text-slate-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const progressStatusClasses = {
  info: "border-slate-200 bg-white/80 text-slate-600",
  active: "border-slate-900 bg-slate-900 text-white",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const progressStepClasses = {
  idle: "border-slate-200 bg-white/70 text-slate-500",
  active:
    "border-slate-900 bg-slate-900 text-white shadow-[0_12px_30px_-20px_rgba(15,23,42,0.85)]",
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const progressSteps = {
  upload: $progressStepUpload,
  queue: $progressStepQueue,
  snap: $progressStepSnap,
  ready: $progressStepReady,
};

const previewScaleClasses = {
  active:
    "border-slate-900 bg-slate-900 text-white shadow-[0_8px_20px_-12px_rgba(15,23,42,0.8)]",
  inactive:
    "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-400 hover:text-slate-900",
};

const previewScaleClassList = {
  active: previewScaleClasses.active.split(" "),
  inactive: previewScaleClasses.inactive.split(" "),
};

const progressStates = {
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
    steps: {
      upload: "complete",
      queue: "complete",
      snap: "active",
      ready: "idle",
    },
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

const HISTORY_KEY = "pixel-snapper-history";
const HISTORY_LIMIT = 12;

let activePreviewUrl = null;
let activeUploadUrl = null;
let isLoading = false;
let previewScale = "1";

const setStatus = (message, tone = "info") => {
  const toneClass = statusClasses[tone] || statusClasses.info;
  $status
    .removeClass(Object.values(statusClasses).join(" "))
    .addClass(toneClass)
    .toggleClass("hidden", !message)
    .text(message || "");
};

const setLoading = (loading) => {
  isLoading = loading;
  $busy.toggleClass("hidden", !loading);
  $form.toggleClass("opacity-60", loading);
  $form.attr("aria-busy", loading ? "true" : "false");
  $submit.prop("disabled", loading);
};

const setProgressStatus = (label, tone = "info") => {
  $progressStatus
    .removeClass(Object.values(progressStatusClasses).join(" "))
    .addClass(progressStatusClasses[tone] || progressStatusClasses.info)
    .text(label);
};

const applyProgressSteps = (steps) => {
  Object.entries(progressSteps).forEach(([key, element]) => {
    const stepState = steps[key] || "idle";
    const stepClass =
      progressStepClasses[stepState] || progressStepClasses.idle;
    element
      .removeClass(Object.values(progressStepClasses).join(" "))
      .addClass(stepClass);
  });
};

const setProgressState = (state, overrides = {}) => {
  const config = progressStates[state] || progressStates.idle;
  const steps = { ...config.steps, ...(overrides.steps || {}) };
  const label = overrides.label || config.label;
  const tone = overrides.tone || config.tone || "info";

  setProgressStatus(label, tone);
  applyProgressSteps(steps);
};

const toSafeDownloadName = (originalName) => {
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

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(reader.error || new Error("Failed to read image data."));
    reader.readAsDataURL(blob);
  });

const createPreviewImage = (url, altText) =>
  dom.create("img", {
    src: url,
    alt: altText,
    class:
      "preview-image pixelated",
  });

const renderUploadPlaceholder = () => {
  $uploadPreview.attr("src", "").attr("alt", "").addClass("hidden");
};

const setUploadPreview = (file) => {
  if (activeUploadUrl) {
    URL.revokeObjectURL(activeUploadUrl);
    activeUploadUrl = null;
  }

  if (!file) {
    renderUploadPlaceholder();
    return;
  }

  activeUploadUrl = URL.createObjectURL(file);
  $uploadPreview
    .attr("src", activeUploadUrl)
    .attr("alt", file.name ? `Uploaded ${file.name}` : "Uploaded image")
    .removeClass("hidden");
};

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => item && typeof item.dataUrl === "string");
  } catch (error) {
    return [];
  }
};

const saveHistory = (items) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch (error) {
  }
};

const formatTimestamp = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString();
};

const renderHistory = (items) => {
  $history.empty();
  if (!items.length) {
    const empty = dom.create(
      "div",
      {
        class:
          "col-span-full flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500",
      },
      dom.create("span", {
        class:
          "text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400",
        text: "No history yet",
      }),
      dom.create("p", { text: "Snapped images saved here for quick download." })
    );
    $history.append(empty);
    return;
  }

  items.forEach((item) => {
    const card = dom.create("div", {
      class:
        "flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm",
    });
    const img = dom.create("img", {
      src: item.dataUrl,
      alt: item.sourceName ? `Snapped ${item.sourceName}` : "Snapped image",
      loading: "lazy",
      class:
        "pixelated h-36 w-full rounded-xl border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.04),rgba(148,163,184,0.08))] object-contain p-3",
    });
    const meta = dom.create("div", {
      class: "flex flex-col gap-1 text-xs text-slate-500",
    });
    const title = dom.create("span", {
      class: "font-semibold text-slate-700",
      text: item.downloadName || item.sourceName || "Snapped image",
    });
    meta.append(title);
    const timestamp = formatTimestamp(item.createdAt);
    if (timestamp) {
      meta.append(dom.create("span", { text: timestamp }));
    }
    if (item.sourceName) {
      meta.append(
        dom.create("span", { text: `Source: ${item.sourceName}` })
      );
    }
    const link = dom.create(
      "a",
      {
        href: item.dataUrl,
        download: item.downloadName || "snapped.png",
        class:
          "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900",
      },
      "Download"
    );
    card.append(img);
    card.append(meta);
    card.append(link);
    $history.append(card);
  });
};

const setPreviewScale = (value) => {
  if (!value) {
    return;
  }
  previewScale = value;
  $result.attr("data-preview-scale", value);
  previewScaleButtons.forEach((button) => {
    const isActive = button.dataset.previewScale === value;
    button.classList.remove(
      ...previewScaleClassList.active,
      ...previewScaleClassList.inactive
    );
    button.classList.add(
      ...(isActive
        ? previewScaleClassList.active
        : previewScaleClassList.inactive)
    );
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
};

let historyItems = loadHistory();
if (historyItems.length > HISTORY_LIMIT) {
  historyItems = historyItems.slice(0, HISTORY_LIMIT);
  saveHistory(historyItems);
}
renderHistory(historyItems);
setProgressState("idle");
setPreviewScale(previewScale);

previewScaleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setPreviewScale(button.dataset.previewScale);
  });
});

const addHistoryItem = async ({ blob, sourceName, downloadName }) => {
  try {
    const dataUrl = await blobToDataUrl(blob);
    if (typeof dataUrl !== "string") {
      return;
    }
    const entry = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      dataUrl,
      sourceName: sourceName || "",
      downloadName: downloadName || "snapped.png",
      createdAt: Date.now(),
    };
    historyItems = [entry, ...historyItems].slice(0, HISTORY_LIMIT);
    saveHistory(historyItems);
    renderHistory(historyItems);
  } catch (error) {
  }
};

const setResult = (url, downloadName) => {
  const preview = dom.create("div", {
    class:
      "preview-viewport relative rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.04),rgba(148,163,184,0.08))] p-4 shadow-sm sm:p-6",
  });
  const img = createPreviewImage(url, "Snapped result");
  const stage = dom.create("div", { class: "preview-stage" });
  const downloadLabel = downloadName || "snapped.png";
  const link = dom.create(
    "a",
    {
      href: url,
      download: downloadLabel,
      class:
        "mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900",
    },
    `Download ${downloadLabel}`
  );

  stage.append(img);
  preview.append(stage);
  $result.empty().append(preview).append(link);
};

$fileInput.on("change", (ev, input) => {
  const file = input.files && input.files[0];
  $fileName.text(file ? file.name : "No file selected");
  setUploadPreview(file);
  if (isLoading) {
    return;
  }
  setProgressState(file ? "ready" : "idle");
});

$form.on("submit", async (ev, form) => {
  ev.preventDefault();
  if (isLoading) {
    return;
  }

  setStatus("");
  setLoading(true);

  try {
    const formData = new FormData(form);
    const file = formData.get("image");
    if (!file || (file instanceof File && file.size === 0)) {
      setStatus("Pick an image before snapping.", "error");
      setProgressState("error", {
        label: "Image needed",
        steps: { upload: "error", queue: "idle", snap: "idle", ready: "idle" },
      });
      return;
    }

    setProgressState("processing");
    const response = await api.post("/process", formData);
    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error("Empty response from the server.");
    }

    if (activePreviewUrl) {
      URL.revokeObjectURL(activePreviewUrl);
    }
    activePreviewUrl = URL.createObjectURL(blob);

    const downloadName = toSafeDownloadName(file.name);
    setResult(activePreviewUrl, downloadName);
    addHistoryItem({ blob, sourceName: file.name, downloadName });
    setStatus("Snapped. Your download is ready.", "success");
    setProgressState("complete");
  } catch (error) {
    const message =
      error && typeof error.message === "string"
        ? error.message
        : "Something went wrong. Try a different image.";
    setStatus(message, "error");
    setProgressState("error", {
      label: "Snap failed",
      steps: {
        upload: "complete",
        queue: "complete",
        snap: "error",
        ready: "idle",
      },
    });
  } finally {
    setLoading(false);
  }
});

window.addEventListener("beforeunload", () => {
  if (activePreviewUrl) {
    URL.revokeObjectURL(activePreviewUrl);
  }
  if (activeUploadUrl) {
    URL.revokeObjectURL(activeUploadUrl);
  }
});
