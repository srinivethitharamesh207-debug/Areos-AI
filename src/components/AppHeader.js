// src/components/AppHeader.js – Compact Mobile-First App Header

export const AppHeader = {
  currentPath: '/overview',

  titles: {
    '/overview': 'Overview',
    '/markets': 'Markets',
    '/portfolio': 'Portfolio',
    '/startups': 'Startups',
    '/analytics': 'Analytics',
    '/watchlist': 'Watchlist',
    '/settings': 'Settings',
    '/ai-intelligence': 'Areos AI'
  },

  render(path = '/overview') {
    this.currentPath = path;
    const isAI = path === '/ai-intelligence';
    const title = this.titles[path] || 'Areos AI';

    if (isAI) {
      return `
      <header id="appHeader" class="h-14 flex-shrink-0 bg-obsidian-sidebar/95 backdrop-blur-md border-b border-obsidian-border px-3 flex items-center justify-between z-30 select-none">
        <!-- Left: History Drawer Button -->
        <button id="btnOpenHistoryDrawer" class="w-10 h-10 rounded-lg flex items-center justify-center text-obsidian-textSecondary hover:text-obsidian-textPrimary hover:bg-obsidian-card active:scale-95 transition-all" title="Chat History">
          <i class="ph ph-clock-counter-clockwise text-xl"></i>
        </button>

        <!-- Center: Areos AI with Green Online Dot -->
        <div class="flex items-center space-x-2">
          <div class="w-6 h-6 rounded-md bg-gradient-to-tr from-obsidian-cyan to-obsidian-aiPurple flex items-center justify-center shadow-[0_0_10px_rgba(167,139,250,0.3)]">
            <i class="ph-fill ph-sparkle text-black text-xs"></i>
          </div>
          <span class="text-sm font-bold tracking-tight text-obsidian-textPrimary font-sans">Areos AI</span>
          <span class="w-1.5 h-1.5 rounded-full bg-obsidian-positive animate-pulse" title="System Online"></span>
        </div>

        <!-- Right: New Chat Button -->
        <button id="btnHeaderNewChat" class="w-10 h-10 rounded-lg flex items-center justify-center text-obsidian-textSecondary hover:text-obsidian-textPrimary hover:bg-obsidian-card active:scale-95 transition-all" title="New Chat">
          <i class="ph ph-note-pencil text-xl"></i>
        </button>
      </header>
      `;
    }

    return `
    <header id="appHeader" class="h-14 flex-shrink-0 bg-obsidian-sidebar/95 backdrop-blur-md border-b border-obsidian-border px-3 sm:px-4 flex items-center justify-between z-30 select-none">
      <!-- Left: Page Title & Logo -->
      <div class="flex items-center space-x-2.5">
        <div class="w-7 h-7 rounded-lg bg-obsidian-card border border-obsidian-border flex items-center justify-center shadow-inner">
          <svg class="w-4 h-4 text-obsidian-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <h1 class="text-sm font-bold tracking-tight text-obsidian-textPrimary font-sans" id="headerTitleText">
          ${title}
        </h1>
      </div>

      <!-- Right: Search, Notification, Profile -->
      <div class="flex items-center space-x-1 sm:space-x-1.5">
        <!-- Search Button (Opens Full-Screen Search Sheet) -->
        <button id="btnHeaderSearch" class="w-10 h-10 rounded-lg flex items-center justify-center text-obsidian-textSecondary hover:text-obsidian-textPrimary hover:bg-obsidian-card active:scale-95 transition-all" title="Search (⌘K)">
          <i class="ph ph-magnifying-glass text-xl"></i>
        </button>

        <!-- Notification Bell with Dot -->
        <button id="btnHeaderNotif" class="w-10 h-10 rounded-lg flex items-center justify-center text-obsidian-textSecondary hover:text-obsidian-textPrimary hover:bg-obsidian-card relative active:scale-95 transition-all" title="Notifications">
          <i class="ph ph-bell text-xl"></i>
          <span class="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-obsidian-cyan ring-2 ring-obsidian-sidebar"></span>
        </button>

        <!-- Profile Avatar -->
        <a href="/settings" data-link class="w-8 h-8 ml-1 rounded-full bg-obsidian-card border border-obsidian-border flex items-center justify-center font-mono text-xs font-bold text-obsidian-cyan hover:border-obsidian-cyan/50 active:scale-95 transition-all" title="Profile & Settings">
          AW
        </a>
      </div>
    </header>
    `;
  },

  update(path) {
    this.currentPath = path;
    const headerContainer = document.getElementById('appHeaderContainer');
    if (headerContainer) {
      headerContainer.innerHTML = this.render(path);
      this.attachListeners();
    }
  },

  attachListeners() {
    const btnSearch = document.getElementById('btnHeaderSearch');
    const btnNotif = document.getElementById('btnHeaderNotif');
    const btnOpenHistory = document.getElementById('btnOpenHistoryDrawer');
    const btnNewChat = document.getElementById('btnHeaderNewChat');

    if (btnSearch) {
      btnSearch.addEventListener('click', () => {
        window.SearchSheet?.open();
      });
    }

    if (btnNotif) {
      btnNotif.addEventListener('click', () => {
        window.Toast?.show('3 Market alerts: NVDA +4.8%, Fed CPI cooling, 12 Startup deals screened.');
      });
    }

    if (btnOpenHistory) {
      btnOpenHistory.addEventListener('click', () => {
        window.HistoryDrawer?.open();
      });
    }

    if (btnNewChat) {
      btnNewChat.addEventListener('click', () => {
        window.AIIntelligencePageInstance?.startNewChat();
      });
    }
  }
};
