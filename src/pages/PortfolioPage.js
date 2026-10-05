// src/pages/PortfolioPage.js – Route: /portfolio (Mobile-First Portfolio Intelligence)

import { Toast } from '../components/Toast.js';

const holdings = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', shares: '120.0', avgPrice: '$112.50', value: '$16,614.00', change: '+4.82%', isPositive: true },
  { symbol: 'AAPL', name: 'Apple Inc', shares: '42.0', avgPrice: '$210.00', value: '$9,581.04', change: '+0.94%', isPositive: true },
  { symbol: 'VOO', name: 'Vanguard S&P 500', shares: '20.0', avgPrice: '$490.20', value: '$10,621.00', change: '+1.24%', isPositive: true },
  { symbol: 'BTC', name: 'Bitcoin (Vault)', shares: '0.084', avgPrice: '$62,400', value: '$5,793.00', change: '+3.45%', isPositive: true },
  { symbol: 'USD', name: 'Cash Reserves', shares: '—', avgPrice: '$1.00', value: '$3,862.00', change: '0.00%', isPositive: true }
];

export const PortfolioPage = {
  render() {
    return `
    <div class="space-y-4 pb-20 select-none">
      
      <!-- Top Title & Rebalance Button -->
      <div class="flex items-center justify-between pt-1">
        <div>
          <h2 class="text-lg font-bold tracking-tight text-obsidian-textPrimary font-sans">
            Portfolio Intelligence
          </h2>
          <p class="text-xs text-obsidian-textSecondary mt-0.5 font-sans">
            Valuation: $48,281.42 • Sharpe 2.48
          </p>
        </div>
        <button id="btnRebalance" class="min-h-[44px] px-3.5 rounded-xl bg-obsidian-card border border-obsidian-cyan/40 text-obsidian-cyan text-xs font-mono font-semibold flex items-center space-x-1.5 active:scale-95 transition-all">
          <i class="ph ph-arrows-clockwise text-base"></i>
          <span>Rebalance</span>
        </button>
      </div>

      <!-- Donut Allocation Card -->
      <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-4 space-y-3">
        <div class="text-[10px] font-mono uppercase tracking-wider text-obsidian-textSecondary">Asset Class Distribution</div>
        
        <div class="flex items-center justify-around py-1">
          <div class="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#202A35" stroke-width="12"></circle>
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#22D3EE" stroke-width="12" stroke-dasharray="169.5 314" stroke-dashoffset="0"></circle>
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#A78BFA" stroke-width="12" stroke-dasharray="69.1 314" stroke-dashoffset="-169.5"></circle>
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#475569" stroke-width="12" stroke-dasharray="37.7 314" stroke-dashoffset="-238.6"></circle>
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#64748B" stroke-width="12" stroke-dasharray="25.1 314" stroke-dashoffset="-276.3"></circle>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span class="text-[9px] font-mono text-obsidian-textSecondary uppercase">TOTAL</span>
              <span class="text-sm font-bold font-mono text-obsidian-textPrimary">$48.2k</span>
            </div>
          </div>

          <div class="space-y-2 text-xs font-mono">
            <div class="flex items-center justify-between space-x-3">
              <div class="flex items-center space-x-2">
                <span class="w-2.5 h-2.5 rounded-full bg-obsidian-cyan"></span>
                <span class="text-obsidian-textSecondary">Equities</span>
              </div>
              <span class="text-obsidian-textPrimary font-semibold">54%</span>
            </div>
            <div class="flex items-center justify-between space-x-3">
              <div class="flex items-center space-x-2">
                <span class="w-2.5 h-2.5 rounded-full bg-obsidian-aiPurple"></span>
                <span class="text-obsidian-textSecondary">ETFs</span>
              </div>
              <span class="text-obsidian-textPrimary font-semibold">22%</span>
            </div>
            <div class="flex items-center justify-between space-x-3">
              <div class="flex items-center space-x-2">
                <span class="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                <span class="text-obsidian-textSecondary">Crypto</span>
              </div>
              <span class="text-obsidian-textPrimary font-semibold">12%</span>
            </div>
            <div class="flex items-center justify-between space-x-3">
              <div class="flex items-center space-x-2">
                <span class="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                <span class="text-obsidian-textSecondary">Cash</span>
              </div>
              <span class="text-obsidian-textPrimary font-semibold">8%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Holdings as Row Items with Icon/Avatar, Name, Price and Colored Change Chip -->
      <div class="space-y-2">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-semibold text-obsidian-textPrimary font-sans">Active Holdings (${holdings.length})</span>
          <span class="text-[10px] font-mono text-obsidian-textSecondary uppercase">Value & Change</span>
        </div>

        <div class="space-y-2">
          ${holdings.map(h => `
            <div class="holding-row-item min-h-[54px] p-3 rounded-2xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/40 hover:bg-obsidian-hover flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer" data-symbol="${h.symbol}">
              <div class="flex items-center space-x-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-obsidian-bg border border-obsidian-border flex items-center justify-center font-mono text-xs font-bold text-obsidian-cyan flex-shrink-0">
                  ${h.symbol}
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-semibold text-obsidian-textPrimary font-sans truncate">${h.name}</div>
                  <div class="text-[10px] text-obsidian-textSecondary font-mono mt-0.5">${h.shares} Shares • Avg: ${h.avgPrice}</div>
                </div>
              </div>

              <div class="flex items-center space-x-2 flex-shrink-0 text-right">
                <div class="font-mono text-xs font-bold text-obsidian-textPrimary">${h.value}</div>
                <span class="px-2 py-1 rounded-lg text-[11px] font-mono font-semibold ${h.isPositive ? 'bg-obsidian-positive/10 text-obsidian-positive border border-obsidian-positive/20' : 'bg-obsidian-negative/10 text-obsidian-negative border border-obsidian-negative/20'}">
                  ${h.change}
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
    const btnRebalance = document.getElementById('btnRebalance');
    if (btnRebalance) {
      btnRebalance.addEventListener('click', () => {
        Toast.show('Executing institutional risk-parity rebalance model...');
      });
    }

    document.querySelectorAll('.holding-row-item').forEach(row => {
      row.addEventListener('click', () => {
        const sym = row.getAttribute('data-symbol');
        Toast.show(`Viewing position details for ${sym}`);
      });
    });
  }
};
