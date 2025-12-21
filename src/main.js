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

const statusClasses = {
  info: "border-slate-200 bg-white/80 text-slate-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const HISTORY_KEY = "pixel-snapper-history";
const HISTORY_LIMIT = 12;

let activePreviewUrl = null;
let activeUploadUrl = null;
let isLoading = false;

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
      "block max-h-[360px] w-full object-contain bg-[linear-gradient(135deg,rgba(15,23,42,0.04),rgba(148,163,184,0.08))] p-6",
  });

const renderUploadPlaceholder = () => {
  $uploadPreview
    .empty()
    .append(
      dom.create("span", {
        class:
          "text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400",
        text: "Preview",
      })
    )
    .append(dom.create("p", { text: "Pick an image to see it here." }));
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
  const label = dom.create("span", {
    class:
      "text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400",
    text: "Uploaded",
  });
  const img = createPreviewImage(
    activeUploadUrl,
    file.name ? `Uploaded ${file.name}` : "Uploaded image"
  );

  $uploadPreview.empty().append(label).append(img);
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
        "h-36 w-full rounded-xl border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.04),rgba(148,163,184,0.08))] object-contain p-3",
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
    card.append(img).append(meta).append(link);
    $history.append(card);
  });
};

let historyItems = loadHistory();
if (historyItems.length > HISTORY_LIMIT) {
  historyItems = historyItems.slice(0, HISTORY_LIMIT);
  saveHistory(historyItems);
}
renderHistory(historyItems);

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
      "relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
  });
  const img = createPreviewImage(url, "Snapped result");
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

  preview.append(img);
  $result.empty().append(preview).append(link);
};

$fileInput.on("change", (ev, input) => {
  const file = input.files && input.files[0];
  $fileName.text(file ? file.name : "No file selected");
  setUploadPreview(file);
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
      return;
    }

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
  } catch (error) {
    const message =
      error && typeof error.message === "string"
        ? error.message
        : "Something went wrong. Try a different image.";
    setStatus(message, "error");
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
