// src/pages/OverviewPage.js – Route: /overview (Mobile-First Home Feed)

import { Toast } from '../components/Toast.js';

export const OverviewPage = {
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning, Alexander';
    if (hour < 18) return 'Good afternoon, Alexander';
    return 'Good evening, Alexander';
  },

  render() {
    return `
    <div class="space-y-4 pb-20 select-none">
      
      <!-- Top Greeting & Live Status -->
      <div class="flex items-center justify-between pt-1">
        <div>
          <h1 class="text-lg font-bold tracking-tight text-obsidian-textPrimary font-sans">
            ${this.getGreeting()}
          </h1>
          <p class="text-xs text-obsidian-textSecondary mt-0.5 font-sans">
            Continuous institutional market feed
          </p>
        </div>
        <div class="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-obsidian-card border border-obsidian-border text-[10px] font-mono text-obsidian-textSecondary">
          <span class="w-1.5 h-1.5 rounded-full bg-obsidian-positive animate-pulse"></span>
          <span id="overviewDate">Oct 4 • LIVE</span>
        </div>
      </div>

      <!-- Quick Actions as Horizontal Scroll Pills (Min 44px tap target) -->
      <div class="flex space-x-2 overflow-x-auto no-scrollbar py-1 text-xs font-sans">
        <a href="/portfolio" data-link class="min-h-[44px] px-3.5 rounded-full bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/40 text-obsidian-textSecondary hover:text-obsidian-textPrimary flex items-center space-x-2 active:scale-95 transition-all whitespace-nowrap flex-shrink-0">
          <i class="ph ph-chart-pie-slice text-base text-obsidian-cyan"></i>
          <span>Portfolio</span>
        </a>
        <a href="/markets" data-link class="min-h-[44px] px-3.5 rounded-full bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/40 text-obsidian-textSecondary hover:text-obsidian-textPrimary flex items-center space-x-2 active:scale-95 transition-all whitespace-nowrap flex-shrink-0">
          <i class="ph ph-chart-line-up text-base text-obsidian-cyan"></i>
          <span>Markets</span>
        </a>
        <a href="/startups" data-link class="min-h-[44px] px-3.5 rounded-full bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/40 text-obsidian-textSecondary hover:text-obsidian-textPrimary flex items-center space-x-2 active:scale-95 transition-all whitespace-nowrap flex-shrink-0">
          <i class="ph ph-rocket-launch text-base text-obsidian-cyan"></i>
          <span>Startups</span>
        </a>
        <a href="/analytics" data-link class="min-h-[44px] px-3.5 rounded-full bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/40 text-obsidian-textSecondary hover:text-obsidian-textPrimary flex items-center space-x-2 active:scale-95 transition-all whitespace-nowrap flex-shrink-0">
          <i class="ph ph-chart-bar text-base text-obsidian-cyan"></i>
          <span>Analytics</span>
        </a>
        <a href="/ai-intelligence" data-link class="min-h-[44px] px-4 rounded-full bg-gradient-to-r from-obsidian-cyan to-obsidian-aiPurple text-black font-semibold flex items-center space-x-2 active:scale-95 transition-all whitespace-nowrap flex-shrink-0 shadow-md">
          <i class="ph-fill ph-sparkle text-base"></i>
          <span>Ask AI</span>
        </a>
      </div>

      <!-- Stats in a 2x2 Grid -->
      <div class="grid grid-cols-2 gap-2.5">
        <!-- Stat 1: Portfolio Value -->
        <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-3.5 hover:border-obsidian-cyan/30 transition-all flex flex-col justify-between">
          <div class="text-[10px] text-obsidian-textSecondary uppercase font-mono tracking-wider">Portfolio Value</div>
          <div class="mt-2 text-lg sm:text-xl font-bold font-mono tracking-tight text-obsidian-textPrimary">$48,281.42</div>
          <div class="mt-1 flex items-center space-x-1 text-[11px] font-mono text-obsidian-positive">
            <i class="ph ph-arrow-up-right text-xs"></i>
            <span>+4.82%</span>
          </div>
        </div>

        <!-- Stat 2: Market Sentiment -->
        <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-3.5 hover:border-obsidian-cyan/30 transition-all flex flex-col justify-between">
          <div class="text-[10px] text-obsidian-textSecondary uppercase font-mono tracking-wider">Market Sentiment</div>
          <div class="mt-2 text-lg sm:text-xl font-bold tracking-tight text-obsidian-textPrimary">Bullish</div>
          <div class="mt-1 flex items-center space-x-1 text-[11px] font-mono text-obsidian-cyan">
            <span>78 / 100</span>
            <span class="text-obsidian-textSecondary text-[9px]">score</span>
          </div>
        </div>

        <!-- Stat 3: Portfolio Risk -->
        <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-3.5 hover:border-obsidian-cyan/30 transition-all flex flex-col justify-between">
          <div class="text-[10px] text-obsidian-textSecondary uppercase font-mono tracking-wider">Portfolio Risk</div>
          <div class="mt-2 text-lg sm:text-xl font-bold tracking-tight text-obsidian-textPrimary">Moderate</div>
          <div class="mt-1 flex items-center space-x-1 text-[11px] font-mono text-obsidian-warning">
            <span>42 / 100</span>
            <span class="text-obsidian-textSecondary text-[9px]">risk</span>
          </div>
        </div>

        <!-- Stat 4: AI Insights -->
        <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-3.5 hover:border-obsidian-aiPurple/40 transition-all flex flex-col justify-between">
          <div class="text-[10px] text-obsidian-textSecondary uppercase font-mono tracking-wider">AI Insights</div>
          <div class="mt-2 text-lg sm:text-xl font-bold font-mono tracking-tight text-obsidian-textPrimary">08 <span class="text-xs text-obsidian-textSecondary font-normal">Active</span></div>
          <div class="mt-1 flex items-center space-x-1 text-[11px] font-mono text-obsidian-aiPurple">
            <span>3 High Priority</span>
          </div>
        </div>
      </div>

      <!-- Chart Full-Width -->
      <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-4 flex flex-col justify-between space-y-3">
        <div class="flex items-center justify-between border-b border-obsidian-border/50 pb-2.5">
          <div>
            <div class="text-[10px] font-mono uppercase tracking-wider text-obsidian-textSecondary">S&P 500 Index</div>
            <div class="flex items-baseline space-x-2 mt-0.5">
              <span class="text-xl font-bold font-mono text-obsidian-textPrimary">$5,842.10</span>
              <span class="text-xs font-mono text-obsidian-positive flex items-center">
                <i class="ph ph-arrow-up-right text-xs mr-0.5"></i> +1.24%
              </span>
            </div>
          </div>
          <a href="/markets" data-link class="min-h-[36px] px-2.5 rounded-lg bg-obsidian-bg border border-obsidian-border hover:border-obsidian-cyan text-obsidian-cyan text-xs font-mono flex items-center space-x-1 active:scale-95 transition-all">
            <span>Markets</span>
            <i class="ph ph-caret-right text-xs"></i>
          </a>
        </div>

        <!-- Full-Width SVG Wave Chart -->
        <div class="relative w-full h-44">
          <svg class="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 200">
            <defs>
              <linearGradient id="ovGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#22D3EE" stop-opacity="0.22"/>
                <stop offset="100%" stop-color="#22D3EE" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <polygon points="0,200 0,140 120,125 240,140 360,95 480,110 600,65 700,35 700,200" fill="url(#ovGradient)"/>
            <path d="M0,140 Q120,120 240,140 T480,110 T700,35" fill="none" stroke="#22D3EE" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="700" cy="35" r="4" fill="#67E8F9" stroke="#080B10" stroke-width="2.5"/>
          </svg>
        </div>

        <div class="flex items-center justify-between text-[10px] font-mono text-obsidian-textSecondary border-t border-obsidian-border/50 pt-2">
          <span>Continuous feed</span>
          <span>1m ago</span>
        </div>
      </div>

      <!-- Allocation Donut Below Chart -->
      <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-4 space-y-3">
        <div class="flex items-center justify-between border-b border-obsidian-border/50 pb-2">
          <div class="text-[10px] font-mono uppercase tracking-wider text-obsidian-textSecondary">Portfolio Allocation</div>
          <a href="/portfolio" data-link class="text-xs font-mono text-obsidian-cyan hover:underline flex items-center space-x-1">
            <span>Details</span>
            <i class="ph ph-caret-right text-xs"></i>
          </a>
        </div>

        <div class="flex items-center justify-around py-2">
          <div class="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#202A35" stroke-width="12"></circle>
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#22D3EE" stroke-width="12" stroke-dasharray="169.5 314" stroke-dashoffset="0"></circle>
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#A78BFA" stroke-width="12" stroke-dasharray="69.1 314" stroke-dashoffset="-169.5"></circle>
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#475569" stroke-width="12" stroke-dasharray="37.7 314" stroke-dashoffset="-238.6"></circle>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span class="text-[9px] font-mono text-obsidian-textSecondary uppercase">TOTAL</span>
              <span class="text-xs font-bold font-mono text-obsidian-textPrimary">$48.2k</span>
            </div>
          </div>

          <div class="space-y-2 text-xs font-mono">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-obsidian-cyan flex-shrink-0"></span>
              <span class="text-obsidian-textSecondary">Equities</span>
              <span class="text-obsidian-textPrimary font-semibold">54%</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-obsidian-aiPurple flex-shrink-0"></span>
              <span class="text-obsidian-textSecondary">ETFs</span>
              <span class="text-obsidian-textPrimary font-semibold">22%</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-slate-500 flex-shrink-0"></span>
              <span class="text-obsidian-textSecondary">Crypto</span>
              <span class="text-obsidian-textPrimary font-semibold">12%</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-slate-700 flex-shrink-0"></span>
              <span class="text-obsidian-textSecondary">Cash</span>
              <span class="text-obsidian-textPrimary font-semibold">8%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity Feed Rows -->
      <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-4 space-y-2.5">
        <div class="text-[10px] font-mono uppercase tracking-wider text-obsidian-textSecondary mb-1">Recent Activity</div>
        <div class="space-y-2 text-xs font-sans">
          <div class="min-h-[46px] p-2.5 rounded-xl bg-obsidian-bg border border-obsidian-border flex items-center justify-between active:scale-[0.99] transition-all">
            <div class="flex items-center space-x-2.5">
              <div class="w-7 h-7 rounded-lg bg-obsidian-cyan/10 border border-obsidian-cyan/20 flex items-center justify-center text-obsidian-cyan">
                <i class="ph ph-arrows-clockwise text-sm"></i>
              </div>
              <div>
                <div class="font-medium text-obsidian-textPrimary">Executed Rebalance Trade</div>
                <div class="text-[10px] text-obsidian-textSecondary font-mono">+1.5 NVDA Shares</div>
              </div>
            </div>
            <span class="text-[10px] font-mono text-obsidian-textSecondary">10m ago</span>
          </div>

          <div class="min-h-[46px] p-2.5 rounded-xl bg-obsidian-bg border border-obsidian-border flex items-center justify-between active:scale-[0.99] transition-all">
            <div class="flex items-center space-x-2.5">
              <div class="w-7 h-7 rounded-lg bg-obsidian-aiPurple/10 border border-obsidian-aiPurple/20 flex items-center justify-center text-obsidian-aiPurple">
                <i class="ph ph-sparkle text-sm"></i>
              </div>
              <div>
                <div class="font-medium text-obsidian-textPrimary">AREOS AI Scan Complete</div>
                <div class="text-[10px] text-obsidian-textSecondary font-mono">12 Growth Deals Identified</div>
              </div>
            </div>
            <span class="text-[10px] font-mono text-obsidian-textSecondary">42m ago</span>
          </div>
        </div>
      </div>

    </div>
    `;
  },

  mount() {
    // Mount clock
    const dateEl = document.getElementById('overviewDate');
    if (dateEl) {
      const now = new Date();
      dateEl.innerText = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' • LIVE';
    }
  }
};
