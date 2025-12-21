import "./main.css";
import dom from "@klt/dom-js";
import { http } from "@klt/dom-js/http";

const api = http.withThrowOnError();

const $form = dom("#snap-form");
const $submit = dom("#snap-button");
const $busy = dom("#busy");
const $status = dom("#status");
const $result = dom("#result");
const $fileInput = dom("#image-input");
const $fileName = dom("#file-name");

const statusClasses = {
  info: "border-slate-200 bg-white/80 text-slate-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

let activePreviewUrl = null;
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

const setResult = (url) => {
  const preview = dom.create("div", {
    class:
      "relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
  });
  const img = dom.create("img", {
    src: url,
    alt: "Snapped result",
    class:
      "block max-h-[360px] w-full object-contain bg-[linear-gradient(135deg,rgba(15,23,42,0.04),rgba(148,163,184,0.08))] p-6",
  });
  const link = dom.create(
    "a",
    {
      href: url,
      download: "snapped.png",
      class:
        "mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900",
    },
    "Download snapped.png"
  );

  preview.append(img);
  $result.empty().append(preview).append(link);
};

$fileInput.on("change", (ev, input) => {
  const file = input.files && input.files[0];
  $fileName.text(file ? file.name : "No file selected");
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

    setResult(activePreviewUrl);
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
});
