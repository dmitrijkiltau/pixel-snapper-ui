const AppFooter = () => (
  <footer className="flex flex-col md:flex-row md:items-end justify-between text-xs gap-4 text-slate-500 reveal dark:text-slate-300" style={{ animationDelay: "320ms" }}>
    <div className="flex flex-col gap-2">
      <span className="font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-400">Pixel Snapper</span>
      <span>Made for clean edges, crunchy dithers, and deliberate palettes.</span>
    </div>

    <div className="flex flex-col sm:flex-row gap-2 sm:text-right">
      <span>
        Created by&nbsp;
        <a
          href="https://kiltau.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-2 hover:text-slate-900 dark:hover:text-white"
        >
          Kiltau
        </a>
      </span>

      <div className="border-l border-slate-300 dark:border-slate-600" />

      <div className="flex gap-2 sm:justify-end">
        <a
          href="https://kiltau.com/legal-notice"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:text-slate-900 dark:hover:text-white"
        >
          Legal Notice
        </a>

        <a
          href="https://kiltau.com/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:text-slate-900 dark:hover:text-white"
        >
          Privacy Policy
        </a>
      </div>
    </div>
  </footer>
);

export default AppFooter;
