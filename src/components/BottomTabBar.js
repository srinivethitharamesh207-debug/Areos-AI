// src/components/BottomTabBar.js – Fixed Bottom Tab Bar for Mobile-First Shell

export const BottomTabBar = {
  currentPath: '/overview',

  render(activePath = '/overview') {
    this.currentPath = activePath;
    const isAI = activePath === '/ai-intelligence';

    // The bottom tab bar is hidden while on /ai-intelligence so the chat input is the bottom element
    const hiddenClass = isAI ? 'hidden' : 'flex';

    const isHome = activePath === '/overview';
    const isMarkets = activePath === '/markets';
    const isPortfolio = activePath === '/portfolio';
    const isMore = ['/startups', '/analytics', '/watchlist', '/settings'].includes(activePath);

    return `
    <nav id="bottomTabBar" class="${hiddenClass} fixed bottom-0 left-0 right-0 sm:absolute sm:max-w-[430px] sm:mx-auto h-16 bg-obsidian-sidebar/95 backdrop-blur-xl border-t border-obsidian-border z-40 items-center justify-around px-1 select-none pb-[max(0.25rem,env(safe-area-inset-bottom))]">
      <!-- 1. Home Tab -->
      <a href="/overview" data-link data-path="/overview" class="tab-btn flex flex-col items-center justify-center flex-1 h-full py-1 text-center group active:scale-95 transition-all">
        <i class="${isHome ? 'ph-fill ph-house text-obsidian-cyan' : 'ph ph-house text-obsidian-textSecondary group-hover:text-obsidian-textPrimary'} text-2xl transition-colors"></i>
        <span class="text-[10px] mt-0.5 font-medium ${isHome ? 'text-obsidian-cyan font-semibold' : 'text-obsidian-textSecondary group-hover:text-obsidian-textPrimary'}">Home</span>
      </a>

      <!-- 2. Markets Tab -->
      <a href="/markets" data-link data-path="/markets" class="tab-btn flex flex-col items-center justify-center flex-1 h-full py-1 text-center group active:scale-95 transition-all">
        <i class="${isMarkets ? 'ph-fill ph-chart-line-up text-obsidian-cyan' : 'ph ph-chart-line-up text-obsidian-textSecondary group-hover:text-obsidian-textPrimary'} text-2xl transition-colors"></i>
        <span class="text-[10px] mt-0.5 font-medium ${isMarkets ? 'text-obsidian-cyan font-semibold' : 'text-obsidian-textSecondary group-hover:text-obsidian-textPrimary'}">Markets</span>
      </a>

      <!-- 3. AI Tab (Center, Purple Accent) -->
      <a href="/ai-intelligence" data-link data-path="/ai-intelligence" class="tab-btn flex flex-col items-center justify-center flex-1 h-full py-1 text-center group active:scale-95 transition-all relative">
        <div class="w-10 h-10 -mt-3 rounded-full bg-gradient-to-tr from-obsidian-aiPurple/20 to-obsidian-cyan/20 border border-obsidian-aiPurple/40 flex items-center justify-center shadow-[0_0_12px_rgba(167,139,250,0.35)] group-hover:shadow-[0_0_16px_rgba(167,139,250,0.5)] transition-all">
          <i class="${isAI ? 'ph-fill ph-sparkle text-obsidian-aiPurple' : 'ph ph-sparkle text-obsidian-aiPurple'} text-2xl"></i>
        </div>
        <span class="text-[10px] mt-0.5 font-semibold text-obsidian-aiPurple">AI</span>
      </a>

      <!-- 4. Portfolio Tab -->
      <a href="/portfolio" data-link data-path="/portfolio" class="tab-btn flex flex-col items-center justify-center flex-1 h-full py-1 text-center group active:scale-95 transition-all">
        <i class="${isPortfolio ? 'ph-fill ph-chart-pie-slice text-obsidian-cyan' : 'ph ph-chart-pie-slice text-obsidian-textSecondary group-hover:text-obsidian-textPrimary'} text-2xl transition-colors"></i>
        <span class="text-[10px] mt-0.5 font-medium ${isPortfolio ? 'text-obsidian-cyan font-semibold' : 'text-obsidian-textSecondary group-hover:text-obsidian-textPrimary'}">Portfolio</span>
      </a>

      <!-- 5. More Tab (Opens Bottom Sheet) -->
      <button id="btnOpenMoreSheet" type="button" class="tab-btn flex flex-col items-center justify-center flex-1 h-full py-1 text-center group active:scale-95 transition-all">
        <i class="${isMore ? 'ph-fill ph-dots-three-circle text-obsidian-cyan' : 'ph ph-dots-three-circle text-obsidian-textSecondary group-hover:text-obsidian-textPrimary'} text-2xl transition-colors"></i>
        <span class="text-[10px] mt-0.5 font-medium ${isMore ? 'text-obsidian-cyan font-semibold' : 'text-obsidian-textSecondary group-hover:text-obsidian-textPrimary'}">More</span>
      </button>
    </nav>
    `;
  },

  update(path) {
    this.currentPath = path;
    const container = document.getElementById('bottomTabBarContainer');
    if (container) {
      container.innerHTML = this.render(path);
      this.attachListeners();
    }
  },

  attachListeners() {
    const btnMore = document.getElementById('btnOpenMoreSheet');
    if (btnMore) {
      btnMore.addEventListener('click', () => {
        window.MoreSheet?.open();
      });
    }
  }
};
