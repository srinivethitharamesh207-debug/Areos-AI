// src/components/MoreSheet.js – Mobile Bottom Sheet for "More" Navigation

export const MoreSheet = {
  render() {
    return `
    <div id="moreSheetBackdrop" class="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 hidden transition-opacity duration-200 opacity-0 flex flex-col justify-end">
      <!-- Click-outside dismiss area -->
      <div id="moreSheetDismiss" class="flex-1 w-full"></div>

      <!-- Sheet Panel -->
      <div id="moreSheetPanel" class="w-full sm:max-w-[430px] sm:mx-auto bg-obsidian-sidebar border-t border-obsidian-border rounded-t-2xl p-5 space-y-4 shadow-2xl transform translate-y-full transition-transform duration-200 ease-out pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <!-- Drag Handle Indicator -->
        <div class="w-10 h-1 bg-obsidian-border rounded-full mx-auto -mt-1 mb-2"></div>

        <!-- Sheet Header -->
        <div class="flex items-center justify-between border-b border-obsidian-border/60 pb-3">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-sm text-obsidian-textPrimary font-sans">More Destinations</span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-obsidian-card text-obsidian-cyan border border-obsidian-border font-semibold">v4.8</span>
          </div>
          <button id="btnCloseMoreSheet" class="w-9 h-9 rounded-lg flex items-center justify-center text-obsidian-textSecondary hover:text-obsidian-textPrimary hover:bg-obsidian-card transition-colors" title="Close">
            <i class="ph ph-x text-lg"></i>
          </button>
        </div>

        <!-- 4 Grid Options -->
        <div class="grid grid-cols-2 gap-2.5">
          <!-- 1. Startups -->
          <a href="/startups" data-link class="more-nav-item min-h-[52px] p-3 rounded-xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/50 hover:bg-obsidian-hover flex items-center space-x-3 active:scale-95 transition-all group">
            <div class="w-9 h-9 rounded-lg bg-obsidian-cyan/10 border border-obsidian-cyan/20 flex items-center justify-center text-obsidian-cyan group-hover:scale-105 transition-transform flex-shrink-0">
              <i class="ph ph-rocket-launch text-xl"></i>
            </div>
            <div class="min-w-0">
              <div class="text-xs font-semibold text-obsidian-textPrimary font-sans truncate">Startups</div>
              <div class="text-[10px] text-obsidian-textSecondary font-mono truncate">12 Deals Screened</div>
            </div>
          </a>

          <!-- 2. Analytics -->
          <a href="/analytics" data-link class="more-nav-item min-h-[52px] p-3 rounded-xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/50 hover:bg-obsidian-hover flex items-center space-x-3 active:scale-95 transition-all group">
            <div class="w-9 h-9 rounded-lg bg-obsidian-aiPurple/10 border border-obsidian-aiPurple/20 flex items-center justify-center text-obsidian-aiPurple group-hover:scale-105 transition-transform flex-shrink-0">
              <i class="ph ph-chart-bar text-xl"></i>
            </div>
            <div class="min-w-0">
              <div class="text-xs font-semibold text-obsidian-textPrimary font-sans truncate">Analytics</div>
              <div class="text-[10px] text-obsidian-textSecondary font-mono truncate">Sharpe & Beta</div>
            </div>
          </a>

          <!-- 3. Watchlist -->
          <a href="/watchlist" data-link class="more-nav-item min-h-[52px] p-3 rounded-xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/50 hover:bg-obsidian-hover flex items-center space-x-3 active:scale-95 transition-all group">
            <div class="w-9 h-9 rounded-lg bg-obsidian-cyan/10 border border-obsidian-cyan/20 flex items-center justify-center text-obsidian-cyan group-hover:scale-105 transition-transform flex-shrink-0">
              <i class="ph ph-bookmark-simple text-xl"></i>
            </div>
            <div class="min-w-0">
              <div class="text-xs font-semibold text-obsidian-textPrimary font-sans truncate">Watchlist</div>
              <div class="text-[10px] text-obsidian-textSecondary font-mono truncate">Tracked Assets</div>
            </div>
          </a>

          <!-- 4. Settings -->
          <a href="/settings" data-link class="more-nav-item min-h-[52px] p-3 rounded-xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/50 hover:bg-obsidian-hover flex items-center space-x-3 active:scale-95 transition-all group">
            <div class="w-9 h-9 rounded-lg bg-obsidian-card border border-obsidian-border flex items-center justify-center text-obsidian-textSecondary group-hover:text-obsidian-textPrimary group-hover:scale-105 transition-transform flex-shrink-0">
              <i class="ph ph-gear-six text-xl"></i>
            </div>
            <div class="min-w-0">
              <div class="text-xs font-semibold text-obsidian-textPrimary font-sans truncate">Settings</div>
              <div class="text-[10px] text-obsidian-textSecondary font-mono truncate">API & Profile</div>
            </div>
          </a>
        </div>

        <!-- Status Card -->
        <div class="p-3 rounded-xl bg-obsidian-card border border-obsidian-border flex items-center justify-between text-xs font-mono">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-obsidian-positive animate-pulse"></span>
            <span class="text-obsidian-textPrimary">Quantum Engine 0.8ms</span>
          </div>
          <span class="text-obsidian-cyan font-semibold text-[11px]">ONLINE</span>
        </div>
      </div>
    </div>
    `;
  },

  open() {
    const backdrop = document.getElementById('moreSheetBackdrop');
    const panel = document.getElementById('moreSheetPanel');
    if (backdrop && panel) {
      backdrop.classList.remove('hidden');
      requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        panel.classList.remove('translate-y-full');
      });
    }
  },

  close() {
    const backdrop = document.getElementById('moreSheetBackdrop');
    const panel = document.getElementById('moreSheetPanel');
    if (backdrop && panel) {
      backdrop.classList.add('opacity-0');
      panel.classList.add('translate-y-full');
      setTimeout(() => {
        backdrop.classList.add('hidden');
      }, 200);
    }
  },

  mount() {
    const backdrop = document.getElementById('moreSheetBackdrop');
    const dismiss = document.getElementById('moreSheetDismiss');
    const btnClose = document.getElementById('btnCloseMoreSheet');

    if (dismiss) dismiss.addEventListener('click', () => this.close());
    if (btnClose) btnClose.addEventListener('click', () => this.close());

    // Close sheet when a navigation link inside is clicked
    document.querySelectorAll('.more-nav-item').forEach(item => {
      item.addEventListener('click', () => this.close());
    });
  }
};
