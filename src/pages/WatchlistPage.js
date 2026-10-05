// src/pages/WatchlistPage.js – Route: /watchlist (Mobile-First Tracked Assets)

import { Toast } from '../components/Toast.js';

const watchlistItems = [
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors', price: '$162.40', change: '+2.15%', target: '$155.00', isPositive: true },
  { symbol: 'ETH', name: 'Ethereum / USD', sector: 'Layer 1 Crypto', price: '$3,520.10', change: '+1.84%', target: '$3,400.00', isPositive: true },
  { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'Enterprise AI', price: '$42.15', change: '-1.04%', target: '$40.00', isPositive: false },
  { symbol: 'AMZN', name: 'Amazon.com Inc', sector: 'Cloud & Consumer', price: '$186.50', change: '+0.72%', target: '$180.00', isPositive: true },
  { symbol: 'ARM', name: 'Arm Holdings PLC', sector: 'Chip Architecture', price: '$148.20', change: '+3.10%', target: '$140.00', isPositive: true }
];

export const WatchlistPage = {
  render() {
    return `
    <div class="space-y-4 pb-20 select-none">
      
      <!-- Top Title & Add Button -->
      <div class="flex items-center justify-between pt-1">
        <div>
          <h2 class="text-lg font-bold tracking-tight text-obsidian-textPrimary font-sans">
            Monitored Watchlist
          </h2>
          <p class="text-xs text-obsidian-textSecondary mt-0.5 font-sans">
            5 target assets with quantitative triggers
          </p>
        </div>
        <button id="btnAddWatchlist" class="min-h-[44px] px-3.5 rounded-xl bg-obsidian-card border border-obsidian-cyan/40 text-obsidian-cyan text-xs font-mono font-semibold flex items-center space-x-1.5 active:scale-95 transition-all">
          <i class="ph ph-plus text-base"></i>
          <span>Add Asset</span>
        </button>
      </div>

      <!-- Watchlist as Row Items with Icon/Avatar, Name, Price and Colored Change Chip -->
      <div class="space-y-2">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-semibold text-obsidian-textPrimary font-sans">Tracked Assets</span>
          <span class="text-[10px] font-mono text-obsidian-textSecondary uppercase">Price & Target</span>
        </div>

        <div class="space-y-2">
          ${watchlistItems.map(item => `
            <div class="watchlist-item-row min-h-[54px] p-3 rounded-2xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/40 hover:bg-obsidian-hover flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer" data-symbol="${item.symbol}">
              <div class="flex items-center space-x-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-obsidian-bg border border-obsidian-border flex items-center justify-center font-mono text-xs font-bold text-obsidian-cyan flex-shrink-0">
                  ${item.symbol}
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-semibold text-obsidian-textPrimary font-sans truncate">${item.name}</div>
                  <div class="text-[10px] text-obsidian-textSecondary font-mono mt-0.5 truncate">${item.sector} • Target: ${item.target}</div>
                </div>
              </div>

              <div class="flex items-center space-x-2 flex-shrink-0 text-right">
                <div class="font-mono text-xs font-bold text-obsidian-textPrimary">${item.price}</div>
                <span class="px-2 py-1 rounded-lg text-[11px] font-mono font-semibold ${item.isPositive ? 'bg-obsidian-positive/10 text-obsidian-positive border border-obsidian-positive/20' : 'bg-obsidian-negative/10 text-obsidian-negative border border-obsidian-negative/20'}">
                  ${item.change}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
    `;
  },

  mount() {
    const btn = document.getElementById('btnAddWatchlist');
    if (btn) {
      btn.addEventListener('click', () => {
        window.SearchSheet?.open();
      });
    }

    document.querySelectorAll('.watchlist-item-row').forEach(row => {
      row.addEventListener('click', () => {
        const sym = row.getAttribute('data-symbol');
        Toast.show(`Viewing alerts & target for ${sym}`);
      });
    });
  }
};
