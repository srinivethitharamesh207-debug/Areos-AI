// src/pages/MarketsPage.js – Route: /markets (Mobile-First Market Intelligence)

import { Toast } from '../components/Toast.js';

const marketSets = {
  SP500: {
    name: "S&P 500",
    val: "$5,842.10",
    chg: "+1.24% today",
    low: "$5,738.20",
    high: "$5,892.40",
    points: "0,200 0,140 90,125 180,140 270,105 360,115 450,75 540,85 620,45 700,25 700,200",
    path: "M0,140 Q90,120 180,140 T360,110 T540,80 T700,25",
    dotY: 25
  },
  NIFTY: {
    name: "NIFTY 50",
    val: "25,182.40",
    chg: "+0.86% today",
    low: "24,980.10",
    high: "25,240.00",
    points: "0,200 0,160 90,145 180,130 270,120 360,95 450,105 540,70 620,55 700,40 700,200",
    path: "M0,160 Q90,145 180,130 T360,95 T540,70 T700,40",
    dotY: 40
  },
  NASDAQ: {
    name: "NASDAQ",
    val: "$18,340.65",
    chg: "+1.92% today",
    low: "$17,990.50",
    high: "$18,410.20",
    points: "0,200 0,180 90,150 180,140 270,105 360,120 450,55 540,45 620,35 700,15 700,200",
    path: "M0,180 Q90,145 180,135 T360,120 T540,45 T700,15",
    dotY: 15
  },
  BTC: {
    name: "Bitcoin",
    val: "$68,412.00",
    chg: "+3.45% today",
    low: "$65,820.00",
    high: "$69,100.00",
    points: "0,200 0,150 90,165 180,120 270,130 360,85 450,100 540,65 620,30 700,20 700,200",
    path: "M0,150 Q90,160 180,120 T360,85 T540,65 T700,20",
    dotY: 20
  }
};

const topMovers = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: '$138.45', change: '+4.82%', signal: 'Strong Buy', isPositive: true },
  { symbol: 'AAPL', name: 'Apple Inc', price: '$228.12', change: '+0.94%', signal: 'Moderate', isPositive: true },
  { symbol: 'MSFT', name: 'Microsoft Corp', price: '$442.80', change: '-0.65%', signal: 'Hold', isPositive: false },
  { symbol: 'TSLA', name: 'Tesla Inc', price: '$248.90', change: '+6.14%', signal: 'Strong Buy', isPositive: true }
];

export const MarketsPage = {
  activeSymbol: 'SP500',
  activeTimeframe: '1M',

  render() {
    return `
    <div class="space-y-4 pb-20 select-none">
      
      <!-- Top Title -->
      <div class="flex items-center justify-between pt-1">
        <div>
          <h2 class="text-lg font-bold tracking-tight text-obsidian-textPrimary font-sans">
            Markets & Indices
          </h2>
          <p class="text-xs text-obsidian-textSecondary mt-0.5 font-sans">
            Institutional real-time global telemetry
          </p>
        </div>
        <div class="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-obsidian-card border border-obsidian-border text-[10px] font-mono text-obsidian-positive">
          <span class="w-1.5 h-1.5 rounded-full bg-obsidian-positive animate-pulse"></span>
          <span>OPEN</span>
        </div>
      </div>

      <!-- Index Switcher as Horizontally Scrollable Chips -->
      <div class="flex space-x-2 overflow-x-auto no-scrollbar py-1">
        <button id="chip-SP500" class="market-index-chip min-h-[44px] px-4 rounded-xl bg-obsidian-card border border-obsidian-cyan text-obsidian-cyan font-semibold text-xs flex items-center space-x-2 flex-shrink-0 active:scale-95 transition-all" data-id="SP500">
          <i class="ph ph-chart-line-up text-base"></i>
          <span>S&P 500</span>
        </button>
        <button id="chip-NIFTY" class="market-index-chip min-h-[44px] px-4 rounded-xl bg-obsidian-card border border-obsidian-border text-obsidian-textSecondary hover:text-obsidian-textPrimary text-xs flex items-center space-x-2 flex-shrink-0 active:scale-95 transition-all" data-id="NIFTY">
          <i class="ph ph-chart-line-up text-base"></i>
          <span>NIFTY 50</span>
        </button>
        <button id="chip-NASDAQ" class="market-index-chip min-h-[44px] px-4 rounded-xl bg-obsidian-card border border-obsidian-border text-obsidian-textSecondary hover:text-obsidian-textPrimary text-xs flex items-center space-x-2 flex-shrink-0 active:scale-95 transition-all" data-id="NASDAQ">
          <i class="ph ph-chart-line-up text-base"></i>
          <span>NASDAQ</span>
        </button>
        <button id="chip-BTC" class="market-index-chip min-h-[44px] px-4 rounded-xl bg-obsidian-card border border-obsidian-border text-obsidian-textSecondary hover:text-obsidian-textPrimary text-xs flex items-center space-x-2 flex-shrink-0 active:scale-95 transition-all" data-id="BTC">
          <i class="ph ph-currency-btc text-base"></i>
          <span>Bitcoin</span>
        </button>
      </div>

      <!-- Interactive Chart Card -->
      <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-4 space-y-3">
        <!-- Display Header -->
        <div class="flex items-center justify-between border-b border-obsidian-border/50 pb-2.5">
          <div>
            <div id="marketIndexName" class="text-[10px] font-mono uppercase tracking-wider text-obsidian-textSecondary">S&P 500</div>
            <div class="flex items-baseline space-x-2 mt-0.5">
              <span id="marketValueDisplay" class="text-xl sm:text-2xl font-bold font-mono text-obsidian-textPrimary">$5,842.10</span>
              <span id="marketChangeDisplay" class="text-xs font-mono text-obsidian-positive flex items-center">
                <i class="ph ph-arrow-up-right text-xs mr-0.5"></i> +1.24% today
              </span>
            </div>
          </div>

          <!-- Timeframe Switcher as Horizontally Scrollable Chips -->
          <div class="flex space-x-1 overflow-x-auto no-scrollbar bg-obsidian-bg p-1 rounded-xl border border-obsidian-border text-xs font-mono">
            <button class="market-tf-chip px-2.5 py-1 rounded-lg text-obsidian-textSecondary hover:text-obsidian-textPrimary active:scale-95 transition-all" data-tf="1D">1D</button>
            <button class="market-tf-chip px-2.5 py-1 rounded-lg text-obsidian-textSecondary hover:text-obsidian-textPrimary active:scale-95 transition-all" data-tf="1W">1W</button>
            <button class="market-tf-chip px-2.5 py-1 rounded-lg bg-obsidian-card text-obsidian-cyan font-bold border border-obsidian-border shadow-sm active:scale-95 transition-all" data-tf="1M">1M</button>
            <button class="market-tf-chip px-2.5 py-1 rounded-lg text-obsidian-textSecondary hover:text-obsidian-textPrimary active:scale-95 transition-all" data-tf="1Y">1Y</button>
          </div>
        </div>

        <!-- SVG Chart -->
        <div class="relative w-full h-48 mt-2" id="marketChartArea">
          <svg id="chartSvg" class="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 200">
            <defs>
              <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#22D3EE" stop-opacity="0.2"/>
                <stop offset="100%" stop-color="#22D3EE" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <line x1="0" y1="50" x2="700" y2="50" stroke="#161D26" stroke-width="1"/>
            <line x1="0" y1="100" x2="700" y2="100" stroke="#161D26" stroke-width="1"/>
            <line x1="0" y1="150" x2="700" y2="150" stroke="#161D26" stroke-width="1"/>

            <polygon id="svgArea" points="0,200 0,140 90,125 180,140 270,105 360,115 450,75 540,85 620,45 700,25 700,200" fill="url(#cyanGradient)"/>
            <path id="svgLine" d="M0,140 Q90,120 180,140 T360,110 T540,80 T700,25" fill="none" stroke="#22D3EE" stroke-width="2.5" stroke-linecap="round"/>
            <circle id="svgDot" cx="700" cy="25" r="4" fill="#67E8F9" stroke="#080B10" stroke-width="2.5"/>
          </svg>
        </div>

        <!-- Range Metrics -->
        <div class="flex items-center justify-between text-[11px] font-mono text-obsidian-textSecondary border-t border-obsidian-border/50 pt-2">
          <div class="flex items-center space-x-3">
            <span>Low: <strong id="rangeLow" class="text-obsidian-textPrimary font-normal">$5,738.20</strong></span>
            <span>High: <strong id="rangeHigh" class="text-obsidian-textPrimary font-normal">$5,892.40</strong></span>
          </div>
          <span class="text-obsidian-cyan">Institutional Feed</span>
        </div>
      </div>

      <!-- Top Movers as Row Items with Icon/Avatar, Name, Price and Colored Change Chip -->
      <div class="space-y-2">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-semibold text-obsidian-textPrimary font-sans">Top Market Movers</span>
          <span class="text-[10px] font-mono text-obsidian-textSecondary uppercase">24H Volume</span>
        </div>

        <div class="space-y-2">
          ${topMovers.map(item => `
            <div class="market-mover-row min-h-[54px] p-3 rounded-2xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/40 hover:bg-obsidian-hover flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer" data-symbol="${item.symbol}">
              <div class="flex items-center space-x-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-obsidian-bg border border-obsidian-border flex items-center justify-center font-mono text-xs font-bold text-obsidian-cyan flex-shrink-0">
                  ${item.symbol}
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-semibold text-obsidian-textPrimary font-sans truncate">${item.name}</div>
                  <div class="text-[10px] text-obsidian-textSecondary font-mono mt-0.5">${item.signal}</div>
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

      <!-- Sector Breakdown -->
      <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-4 space-y-3">
        <div class="text-xs font-semibold text-obsidian-textPrimary font-sans">Sector Performance</div>
        <div class="space-y-2.5 text-xs font-mono">
          <div>
            <div class="flex justify-between text-obsidian-textSecondary mb-1">
              <span>Technology</span>
              <span class="text-obsidian-positive font-semibold">+2.4%</span>
            </div>
            <div class="w-full h-1.5 rounded-full bg-obsidian-bg"><div class="h-full rounded-full bg-obsidian-cyan w-[78%]"></div></div>
          </div>
          <div>
            <div class="flex justify-between text-obsidian-textSecondary mb-1">
              <span>Energy</span>
              <span class="text-obsidian-negative font-semibold">-1.1%</span>
            </div>
            <div class="w-full h-1.5 rounded-full bg-obsidian-bg"><div class="h-full rounded-full bg-obsidian-negative w-[42%]"></div></div>
          </div>
          <div>
            <div class="flex justify-between text-obsidian-textSecondary mb-1">
              <span>Financials</span>
              <span class="text-obsidian-positive font-semibold">+0.8%</span>
            </div>
            <div class="w-full h-1.5 rounded-full bg-obsidian-bg"><div class="h-full rounded-full bg-obsidian-cyan w-[64%]"></div></div>
          </div>
        </div>
      </div>

    </div>
    `;
  },

  mount() {
    const setMarket = (symbol) => {
      this.activeSymbol = symbol;
      const data = marketSets[symbol];
      if (!data) return;

      const nameEl = document.getElementById('marketIndexName');
      const valEl = document.getElementById('marketValueDisplay');
      const chgEl = document.getElementById('marketChangeDisplay');
      const lowEl = document.getElementById('rangeLow');
      const highEl = document.getElementById('rangeHigh');

      if (nameEl) nameEl.innerText = data.name;
      if (valEl) valEl.innerText = data.val;
      if (chgEl) chgEl.innerHTML = `<i class="ph ph-arrow-up-right text-xs mr-0.5"></i> ${data.chg}`;
      if (lowEl) lowEl.innerText = data.low;
      if (highEl) highEl.innerText = data.high;

      const svgArea = document.getElementById('svgArea');
      const svgLine = document.getElementById('svgLine');
      const svgDot = document.getElementById('svgDot');

      if (svgArea) svgArea.setAttribute('points', data.points);
      if (svgLine) svgLine.setAttribute('d', data.path);
      if (svgDot) svgDot.setAttribute('cy', data.dotY);

      document.querySelectorAll('.market-index-chip').forEach(chip => {
        const id = chip.getAttribute('data-id');
        if (id === symbol) {
          chip.className = 'market-index-chip min-h-[44px] px-4 rounded-xl bg-obsidian-card border border-obsidian-cyan text-obsidian-cyan font-semibold text-xs flex items-center space-x-2 flex-shrink-0 active:scale-95 transition-all';
        } else {
          chip.className = 'market-index-chip min-h-[44px] px-4 rounded-xl bg-obsidian-card border border-obsidian-border text-obsidian-textSecondary hover:text-obsidian-textPrimary text-xs flex items-center space-x-2 flex-shrink-0 active:scale-95 transition-all';
        }
      });
    };

    document.querySelectorAll('.market-index-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.getAttribute('data-id');
        if (id) setMarket(id);
      });
    });

    document.querySelectorAll('.market-tf-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.market-tf-chip').forEach(c => {
          c.className = 'market-tf-chip px-2.5 py-1 rounded-lg text-obsidian-textSecondary hover:text-obsidian-textPrimary active:scale-95 transition-all';
        });
        chip.className = 'market-tf-chip px-2.5 py-1 rounded-lg bg-obsidian-card text-obsidian-cyan font-bold border border-obsidian-border shadow-sm active:scale-95 transition-all';
        Toast.show(`Timeframe set to ${chip.getAttribute('data-tf')}`);
      });
    });

    document.querySelectorAll('.market-mover-row').forEach(row => {
      row.addEventListener('click', () => {
        const sym = row.getAttribute('data-symbol');
        Toast.show(`Viewing quote & metrics for ${sym}`);
      });
    });
  }
};
