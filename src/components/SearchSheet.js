// src/components/SearchSheet.js – Full-Screen Mobile Search Sheet

import { router } from '../router/index.js';

const SEARCHABLE_ITEMS = [
  // Markets & Stocks
  { type: 'Stock', symbol: 'NVDA', name: 'NVIDIA Corporation', path: '/markets', subtitle: 'Tech • +4.82%' },
  { type: 'Stock', symbol: 'AAPL', name: 'Apple Inc.', path: '/markets', subtitle: 'Consumer Tech • +0.94%' },
  { type: 'Stock', symbol: 'MSFT', name: 'Microsoft Corporation', path: '/markets', subtitle: 'Cloud & AI • -0.65%' },
  { type: 'Stock', symbol: 'TSLA', name: 'Tesla Inc.', path: '/markets', subtitle: 'EV & Autonomy • +6.14%' },
  { type: 'Stock', symbol: 'AMD', name: 'Advanced Micro Devices', path: '/watchlist', subtitle: 'Semiconductors • +2.15%' },
  { type: 'Stock', symbol: 'PLTR', name: 'Palantir Technologies', path: '/watchlist', subtitle: 'Enterprise AI • -1.04%' },
  { type: 'Index', symbol: 'S&P 500', name: 'Standard & Poor\'s 500', path: '/markets', subtitle: 'US Market Index • +1.24%' },
  { type: 'Index', symbol: 'NIFTY 50', name: 'National Stock Exchange', path: '/markets', subtitle: 'India Market Index • +0.86%' },
  { type: 'Crypto', symbol: 'BTC', name: 'Bitcoin / USD', path: '/markets', subtitle: 'Digital Asset • +3.45%' },
  { type: 'Crypto', symbol: 'ETH', name: 'Ethereum / USD', path: '/watchlist', subtitle: 'Smart Contracts • +1.84%' },
  // Startups
  { type: 'Startup', symbol: 'NQ', name: 'NeuroQubits', path: '/startups', subtitle: 'Quantum AI Hardware • Score: 94' },
  { type: 'Startup', symbol: 'QF', name: 'QuantumFlux', path: '/startups', subtitle: 'Superconducting • Score: 96' },
  { type: 'Startup', symbol: 'SB', name: 'Solenis Bio', path: '/startups', subtitle: 'Synthetic Biology • Score: 89' },
  // App Features
  { type: 'Feature', symbol: 'AI', name: 'Areos AI Intelligence Co-Pilot', path: '/ai-intelligence', subtitle: 'Ask questions & risk models' },
  { type: 'Feature', symbol: 'PF', name: 'Portfolio Allocation & Rebalance', path: '/portfolio', subtitle: '$48,281.42 • 54% Equities' },
  { type: 'Feature', symbol: 'AN', name: 'Institutional Risk Analytics', path: '/analytics', subtitle: 'Sharpe 2.48 • Beta 0.86' }
];

export const SearchSheet = {
  render() {
    return `
    <div id="searchSheet" class="fixed inset-0 bg-obsidian-bg z-50 hidden flex-col select-none overflow-hidden sm:max-w-[430px] sm:mx-auto sm:border-x sm:border-obsidian-border/50">
      <!-- Search Top Bar -->
      <div class="h-16 px-4 bg-obsidian-sidebar border-b border-obsidian-border flex items-center space-x-3 flex-shrink-0 pt-[env(safe-area-inset-top)]">
        <button id="btnCloseSearchSheet" class="w-10 h-10 rounded-lg flex items-center justify-center text-obsidian-textSecondary hover:text-obsidian-textPrimary hover:bg-obsidian-card active:scale-95 transition-all" title="Back">
          <i class="ph ph-caret-left text-2xl"></i>
        </button>

        <div class="flex-1 relative flex items-center">
          <i class="ph ph-magnifying-glass text-lg text-obsidian-textSecondary absolute left-3 pointer-events-none"></i>
          <input
            type="text"
            id="searchSheetInput"
            placeholder="Search stocks, indices, startups..."
            class="w-full h-11 bg-obsidian-card border border-obsidian-border rounded-xl pl-9 pr-9 text-xs text-obsidian-textPrimary placeholder-obsidian-textSecondary focus:border-obsidian-cyan focus:outline-none font-sans"
            autocomplete="off"
            autofocus
          />
          <button id="btnClearSearchInput" class="w-8 h-8 rounded-full hidden absolute right-1 flex items-center justify-center text-obsidian-textSecondary hover:text-obsidian-textPrimary">
            <i class="ph ph-x text-sm"></i>
          </button>
        </div>
      </div>

      <!-- Quick Category Chips -->
      <div class="px-4 py-2.5 bg-obsidian-card/40 border-b border-obsidian-border/50 flex space-x-2 overflow-x-auto no-scrollbar flex-shrink-0 text-xs font-mono">
        <button class="search-filter-chip px-3 py-1.5 rounded-full bg-obsidian-card border border-obsidian-cyan/40 text-obsidian-cyan font-semibold active:scale-95 transition-all whitespace-nowrap" data-filter="all">All</button>
        <button class="search-filter-chip px-3 py-1.5 rounded-full bg-obsidian-card border border-obsidian-border text-obsidian-textSecondary hover:text-obsidian-textPrimary active:scale-95 transition-all whitespace-nowrap" data-filter="Stock">Stocks</button>
        <button class="search-filter-chip px-3 py-1.5 rounded-full bg-obsidian-card border border-obsidian-border text-obsidian-textSecondary hover:text-obsidian-textPrimary active:scale-95 transition-all whitespace-nowrap" data-filter="Index">Indices</button>
        <button class="search-filter-chip px-3 py-1.5 rounded-full bg-obsidian-card border border-obsidian-border text-obsidian-textSecondary hover:text-obsidian-textPrimary active:scale-95 transition-all whitespace-nowrap" data-filter="Startup">Startups</button>
        <button class="search-filter-chip px-3 py-1.5 rounded-full bg-obsidian-card border border-obsidian-border text-obsidian-textSecondary hover:text-obsidian-textPrimary active:scale-95 transition-all whitespace-nowrap" data-filter="Feature">Features</button>
      </div>

      <!-- Search Results Container -->
      <div id="searchResultsList" class="flex-1 overflow-y-auto p-4 space-y-2">
        <!-- Rendered dynamically -->
      </div>
    </div>
    `;
  },

  currentFilter: 'all',

  open() {
    const sheet = document.getElementById('searchSheet');
    const input = document.getElementById('searchSheetInput');
    if (sheet) {
      sheet.classList.remove('hidden');
      sheet.classList.add('flex');
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 50);
      }
      this.renderResults('');
    }
  },

  close() {
    const sheet = document.getElementById('searchSheet');
    if (sheet) {
      sheet.classList.add('hidden');
      sheet.classList.remove('flex');
    }
  },

  renderResults(query = '') {
    const listEl = document.getElementById('searchResultsList');
    if (!listEl) return;

    const q = query.trim().toLowerCase();
    const filtered = SEARCHABLE_ITEMS.filter(item => {
      const matchFilter = this.currentFilter === 'all' || item.type === this.currentFilter;
      const matchQuery = !q || 
        item.symbol.toLowerCase().includes(q) || 
        item.name.toLowerCase().includes(q) || 
        item.subtitle.toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="py-12 text-center text-obsidian-textSecondary font-mono text-xs">
          <i class="ph ph-magnifying-glass text-3xl opacity-30 mb-2"></i>
          <div>No results found for "${query}"</div>
          <div class="text-[10px] mt-1 text-obsidian-textSecondary/70">Try searching "NVDA", "Portfolio", "Startups", or "S&P 500"</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(item => `
      <div class="search-result-row min-h-[50px] p-3 rounded-xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/40 hover:bg-obsidian-hover cursor-pointer flex items-center justify-between active:scale-[0.98] transition-all" data-path="${item.path}">
        <div class="flex items-center space-x-3 min-w-0">
          <div class="w-9 h-9 rounded-lg bg-obsidian-bg border border-obsidian-border flex items-center justify-center font-mono text-xs font-bold text-obsidian-cyan flex-shrink-0">
            ${item.symbol}
          </div>
          <div class="min-w-0">
            <div class="text-xs font-semibold text-obsidian-textPrimary font-sans truncate">${item.name}</div>
            <div class="text-[10px] text-obsidian-textSecondary font-mono truncate">${item.subtitle}</div>
          </div>
        </div>
        <div class="flex items-center space-x-1 text-obsidian-textSecondary text-xs">
          <span class="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-obsidian-bg border border-obsidian-border">${item.type}</span>
          <i class="ph ph-caret-right text-sm"></i>
        </div>
      </div>
    `).join('');
  },

  mount() {
    const btnClose = document.getElementById('btnCloseSearchSheet');
    const input = document.getElementById('searchSheetInput');
    const btnClear = document.getElementById('btnClearSearchInput');

    if (btnClose) btnClose.addEventListener('click', () => this.close());

    if (input) {
      input.addEventListener('input', () => {
        const val = input.value;
        if (btnClear) {
          if (val.length > 0) btnClear.classList.remove('hidden');
          else btnClear.classList.add('hidden');
        }
        this.renderResults(val);
      });
    }

    if (btnClear && input) {
      btnClear.addEventListener('click', () => {
        input.value = '';
        btnClear.classList.add('hidden');
        this.renderResults('');
        input.focus();
      });
    }

    // Filter Chips
    document.querySelectorAll('.search-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.search-filter-chip').forEach(c => {
          c.className = 'search-filter-chip px-3 py-1.5 rounded-full bg-obsidian-card border border-obsidian-border text-obsidian-textSecondary hover:text-obsidian-textPrimary active:scale-95 transition-all whitespace-nowrap';
        });
        chip.className = 'search-filter-chip px-3 py-1.5 rounded-full bg-obsidian-card border border-obsidian-cyan/40 text-obsidian-cyan font-semibold active:scale-95 transition-all whitespace-nowrap';
        this.currentFilter = chip.getAttribute('data-filter') || 'all';
        this.renderResults(input ? input.value : '');
      });
    });

    // Delegate row click for navigation
    const listEl = document.getElementById('searchResultsList');
    if (listEl) {
      listEl.addEventListener('click', (e) => {
        const row = e.target.closest('.search-result-row');
        if (row) {
          const path = row.getAttribute('data-path');
          if (path) {
            this.close();
            router.navigate(path);
          }
        }
      });
    }
  }
};
