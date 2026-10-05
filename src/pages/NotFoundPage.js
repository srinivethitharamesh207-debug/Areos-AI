// src/pages/NotFoundPage.js – Route: 404 (Mobile-First Error View)

export const NotFoundPage = {
  render() {
    return `
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-4 select-none">
      <div class="w-14 h-14 rounded-2xl bg-obsidian-card border border-obsidian-border flex items-center justify-center text-obsidian-cyan shadow-lg">
        <i class="ph ph-warning-circle text-2xl"></i>
      </div>
      <div>
        <h1 class="text-xl font-bold font-sans text-obsidian-textPrimary">404 — Page Not Found</h1>
        <p class="text-xs text-obsidian-textSecondary mt-1 max-w-xs font-sans">The requested view does not exist in the current AREOS AI navigation index.</p>
      </div>
      <a href="/overview" data-link class="min-h-[44px] px-5 rounded-xl bg-obsidian-cyan text-black font-semibold text-xs flex items-center justify-center hover:bg-obsidian-brightCyan active:scale-95 transition-all shadow-md">
        Return Home
      </a>
    </div>
    `;
  },

  mount() {}
};
