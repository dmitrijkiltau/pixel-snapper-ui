export type StatusTone = "info" | "success" | "error";
export type ProgressTone = "info" | "active" | "success" | "error";
export type ProgressStepKey = "upload" | "queue" | "snap" | "ready";
export type ProgressStepState = "idle" | "active" | "complete" | "error";
export type ProgressStateKey = "idle" | "ready" | "processing" | "complete" | "error";
export type PreviewBackgroundOption = "light" | "dark";
export type HistoryItem = {
  id: string;
  dataUrl: string;
  originalDataUrl?: string;
  sourceName: string;
  downloadName: string;
  createdAt: number;
  width?: number;
  height?: number;
  kColors?: number;
  kSeed?: number;
};
