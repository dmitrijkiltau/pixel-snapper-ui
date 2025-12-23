const howItWorksSteps = [
  {
    title: "Upload and set palette",
    description: "Drop your source, then dial in the palette size before pixel snapping begins.",
  },
  {
    title: "Optionally edit the result",
    description: "Use the editing tools to tweak the processed image before export.",
  },
  {
    title: "Export the PNG",
    description: "The cleaned output is encoded as PNG so you can download it instantly.",
  },
];

const HeroHeader = () => (
  <header className="grid gap-6 items-center lg:grid-cols-[1.1fr_0.9fr] reveal" style={{ animationDelay: "80ms" }}>
    <div className="flex flex-col gap-5">
      <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Pixel Snapper
        <span className="block text-muted">Snap noisy art into a clean grid.</span>
      </h1>
      <p className="max-w-xl text-base text-subtle sm:text-lg">
        Upload a source image, pick your palette size, and get a crisp pixel-perfect render with strict grid alignment.
      </p>
    </div>
    <div className="panel-card relative flex flex-col gap-5 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 pixel-grid opacity-40"></div>
        <div className="absolute -right-16 -top-20 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-300/20"></div>
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-300/20"></div>
      </div>
      <div className="relative flex items-center justify-between">
        <div className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
          How it works
        </div>
        <span className="step-pill bg-paper/10 text-subtle">3 steps</span>
      </div>
      <ol className="relative flex flex-col gap-3 text-sm text-slate-700 dark:text-slate-200">
        {howItWorksSteps.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-3 rounded-2xl border border-border bg-surface/75 p-3 shadow-sm"
          >
            <div className="flex h-9 w-9 aspect-square items-center justify-center rounded-xl bg-ink text-xs font-semibold text-paper">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink">{step.title}</span>
              <span className="text-xs text-subtle">{step.description}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  </header>
);

export default HeroHeader;
