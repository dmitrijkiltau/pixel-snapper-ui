import { TagPill } from "./shared";

const heroTags = ["Pixel Lab", "Vite + Tailwind 4", "TSX"];

const howItWorksSteps = [
  "Cluster colors with K-means so the palette stays tight.",
  "Snap every pixel onto a grid to remove jitter.",
  "Download the cleaned PNG with no extra clicks.",
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
      <div className="panel-card flex flex-col gap-4">
        <div className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
          How it works
        </div>
        <ol className="space-y-3 text-sm text-slate-700">
          {howItWorksSteps.map((step) => (
            <li key={step} className="flex gap-3">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-900"></span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  </header>
);

export default HeroHeader;
