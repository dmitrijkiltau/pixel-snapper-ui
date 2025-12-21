import { TagPill } from "./shared";

const heroTags = ["Pixel Lab", "Vite + Tailwind 4", "TSX"];

const howItWorksSteps = [
  {
    title: "Quantize the palette",
    description: "K-means clustering keeps colors tight to the size you choose.",
  },
  {
    title: "Lock to the grid",
    description: "Every pixel snaps to a clean grid to remove jitter.",
  },
  {
    title: "Grab the PNG",
    description: "Download the processed image as a PNG file.",
  },
];

const HeroHeader = () => (
  <header className="flex flex-col gap-6 reveal" style={{ animationDelay: "80ms" }}>
    <div className="flex flex-wrap items-center gap-3">
      {heroTags.map((tag) => (
        <TagPill key={tag} label={tag} />
      ))}
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
      <div className="panel-card relative flex flex-col gap-5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 pixel-grid opacity-40"></div>
          <div className="absolute -right-16 -top-20 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl"></div>
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl"></div>
        </div>
        <div className="relative flex items-center justify-between">
          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
            How it works
          </div>
          <span className="step-pill bg-slate-900/10 text-slate-700">3 steps</span>
        </div>
        <ol className="relative flex flex-col gap-3 text-sm text-slate-700">
          {howItWorksSteps.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/75 p-3 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-900">{step.title}</span>
                <span className="text-xs text-slate-600">{step.description}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </header>
);

export default HeroHeader;
