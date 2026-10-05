// src/pages/AnalyticsPage.js – Route: /analytics (Mobile-First Institutional Analytics)

import { Toast } from '../components/Toast.js';

export const AnalyticsPage = {
  render() {
    return `
    <div class="space-y-4 pb-20 select-none">
      
      <!-- Top Title -->
      <div class="flex items-center justify-between pt-1">
        <div>
          <h2 class="text-lg font-bold tracking-tight text-obsidian-textPrimary font-sans">
            Institutional Analytics
          </h2>
          <p class="text-xs text-obsidian-textSecondary mt-0.5 font-sans">
            Quantitative factor exposures & correlation matrix
          </p>
        </div>
        <div class="px-2.5 py-1 rounded-full bg-obsidian-card border border-obsidian-border text-[10px] font-mono text-obsidian-cyan font-semibold">
          Alpha Models
        </div>
      </div>

      <!-- Core Metrics in a 3-Card Stack / Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-4 flex flex-col justify-between">
          <div class="text-[10px] font-mono text-obsidian-textSecondary uppercase tracking-wider">Sharpe Ratio</div>
          <div class="text-2xl font-mono font-bold text-obsidian-textPrimary mt-1.5">2.48</div>
          <div class="text-[10px] font-mono text-obsidian-positive mt-1">Top 5% Institutional Benchmark</div>
        </div>

        <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-4 flex flex-col justify-between">
          <div class="text-[10px] font-mono text-obsidian-textSecondary uppercase tracking-wider">Beta vs S&P 500</div>
          <div class="text-2xl font-mono font-bold text-obsidian-textPrimary mt-1.5">0.86</div>
          <div class="text-[10px] font-mono text-obsidian-cyan mt-1">Defensive Growth Beta</div>
        </div>

        <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-4 flex flex-col justify-between">
          <div class="text-[10px] font-mono text-obsidian-textSecondary uppercase tracking-wider">Max Drawdown (YTD)</div>
          <div class="text-2xl font-mono font-bold text-obsidian-textPrimary mt-1.5">-4.12%</div>
          <div class="text-[10px] font-mono text-obsidian-positive mt-1">Low Volatility Controlled</div>
        </div>
      </div>

      <!-- Correlation Matrix Card -->
      <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-4 space-y-3">
        <div class="text-xs font-semibold text-obsidian-textPrimary font-sans">Asset Class Correlation Matrix</div>
        <div class="overflow-x-auto">
          <table class="w-full text-center text-xs font-mono">
            <thead>
              <tr class="text-obsidian-textSecondary border-b border-obsidian-border pb-2 text-[10px]">
                <th class="text-left py-2 font-normal">Asset</th>
                <th class="py-2 font-normal">Equities</th>
                <th class="py-2 font-normal">ETFs</th>
                <th class="py-2 font-normal">Crypto</th>
                <th class="py-2 font-normal">Cash</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-obsidian-border/40">
              <tr>
                <td class="text-left py-2.5 font-sans font-medium text-obsidian-textPrimary">Equities</td>
                <td class="text-obsidian-cyan font-bold">1.00</td>
                <td class="text-obsidian-textPrimary">0.78</td>
                <td class="text-obsidian-textPrimary">0.42</td>
                <td class="text-obsidian-textSecondary">-0.05</td>
              </tr>
              <tr>
                <td class="text-left py-2.5 font-sans font-medium text-obsidian-textPrimary">ETFs</td>
                <td class="text-obsidian-textPrimary">0.78</td>
                <td class="text-obsidian-cyan font-bold">1.00</td>
                <td class="text-obsidian-textPrimary">0.31</td>
                <td class="text-obsidian-textSecondary">-0.02</td>
              </tr>
              <tr>
                <td class="text-left py-2.5 font-sans font-medium text-obsidian-textPrimary">Crypto</td>
                <td class="text-obsidian-textPrimary">0.42</td>
                <td class="text-obsidian-textPrimary">0.31</td>
                <td class="text-obsidian-cyan font-bold">1.00</td>
                <td class="text-obsidian-textSecondary">-0.12</td>
              </tr>
              <tr>
                <td class="text-left py-2.5 font-sans font-medium text-obsidian-textPrimary">Cash</td>
                <td class="text-obsidian-textSecondary">-0.05</td>
                <td class="text-obsidian-textSecondary">-0.02</td>
                <td class="text-obsidian-textSecondary">-0.12</td>
                <td class="text-obsidian-cyan font-bold">1.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
    `;
  },

  mount() {
    //
  }
};
