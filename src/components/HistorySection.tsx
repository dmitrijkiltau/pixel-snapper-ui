import type { HistoryItem } from "./types";
import { cx, SectionHeader, StepPill, TagPill } from "./shared";

const formatTimestamp = (value: number) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString();
};

type HistoryCardProps = {
  item: HistoryItem;
  isActive: boolean;
  onSelect: (id: string) => void;
};

const HistoryCard = ({ item, isActive, onSelect }: HistoryCardProps) => {
  const timestamp = formatTimestamp(item.createdAt);
  const paletteLabel =
    typeof item.kColors === "number" && Number.isFinite(item.kColors)
      ? `${item.kColors} colors`
      : null;
  const dimensionsLabel =
    typeof item.width === "number" &&
    typeof item.height === "number" &&
    Number.isFinite(item.width) &&
    Number.isFinite(item.height)
      ? `${item.width}x${item.height} px`
      : null;
  const seedLabel =
    typeof item.kSeed === "number" && Number.isFinite(item.kSeed)
      ? String(item.kSeed)
      : null;

  return (
    <details
      className={cx(
        "flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60",
        isActive && "ring-2 ring-slate-900/15 dark:ring-slate-100/25"
      )}
    >
      <summary className="details-summary flex cursor-pointer flex-col gap-3">
        <img
          src={item.dataUrl}
          alt={item.sourceName ? `Result from ${item.sourceName}` : "Result image"}
          loading="lazy"
          className="pixelated h-36 w-full rounded-xl border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.04),rgba(148,163,184,0.08))] object-contain p-3 dark:border-slate-700 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.7),rgba(30,41,59,0.55))]"
        />
        <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-300">
          <span className="font-semibold text-slate-700 dark:text-slate-100">
            {item.downloadName || item.sourceName || "Result image"}
          </span>
          {timestamp || paletteLabel ? (
            <div className="flex items-center justify-between gap-2">
              <span>{timestamp}</span>
              {paletteLabel ? <TagPill label={paletteLabel} /> : null}
            </div>
          ) : null}
        </div>
      </summary>
      <div className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-300">
        {dimensionsLabel ? <span>Dimensions: {dimensionsLabel}</span> : null}
        {paletteLabel ? <span>Palette: {paletteLabel}</span> : null}
        {seedLabel ? <span>Seed: {seedLabel}</span> : null}
        {item.sourceName ? <span>Source: {item.sourceName}</span> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100"
        >
          Edit in panel
        </button>
        <a
          href={item.dataUrl}
          download={item.downloadName || "snapped.png"}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-slate-100"
        >
          Download
        </a>
      </div>
    </details>
  );
};

const HistoryEmpty = () => (
  <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-400">No history yet</span>
    <p>Snapped images saved here for quick download.</p>
  </div>
);

type HistorySectionProps = {
  items: HistoryItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

const HistorySection = ({ items, activeId, onSelect }: HistorySectionProps) => (
  <section className="panel-card flex flex-col gap-5 reveal" style={{ animationDelay: "260ms" }}>
    <SectionHeader
      title="History"
      subtitle="Saved locally for quick downloads."
      action={<StepPill label="Local" />}
    />

    <div id="history" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
      {items.length === 0 ? (
        <HistoryEmpty />
      ) : (
        items.map((item) => (
          <HistoryCard
            key={item.id}
            item={item}
            isActive={item.id === activeId}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  </section>
);

export default HistorySection;
