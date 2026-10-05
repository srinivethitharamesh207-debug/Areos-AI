// src/pages/StartupsPage.js – Route: /startups (Mobile-First Venture Dealflow)

import { Toast } from '../components/Toast.js';

const startupsList = [
  { symbol: 'NQ', name: 'NeuroQubits', stage: 'Series A', sector: 'Quantum AI Hardware', tam: '$14.2B', score: 94, risk: 'Moderate', riskColor: 'bg-obsidian-warning/10 text-obsidian-warning border-obsidian-warning/20' },
  { symbol: 'QF', name: 'QuantumFlux', stage: 'Series B', sector: 'Superconducting Computing', tam: '$22.0B', score: 96, risk: 'Low', riskColor: 'bg-obsidian-positive/10 text-obsidian-positive border-obsidian-positive/20' },
  { symbol: 'SB', name: 'Solenis Bio', stage: 'Seed', sector: 'Synthetic Biology', tam: '$4.8B', score: 89, risk: 'High', riskColor: 'bg-obsidian-negative/10 text-obsidian-negative border-obsidian-negative/20' },
  { symbol: 'AP', name: 'Aether Photonics', stage: 'Seed', sector: 'Optical AI Interconnects', tam: '$9.5B', score: 91, risk: 'Moderate', riskColor: 'bg-obsidian-warning/10 text-obsidian-warning border-obsidian-warning/20' },
  { symbol: 'CD', name: 'Cognitive Dynamics', stage: 'Series A', sector: 'Autonomous Robotics', tam: '$18.4B', score: 88, risk: 'Moderate', riskColor: 'bg-obsidian-warning/10 text-obsidian-warning border-obsidian-warning/20' },
  { symbol: 'HL', name: 'HyperLattice', stage: 'Pre-Seed', sector: 'Crystalline Energy', tam: '$6.2B', score: 85, risk: 'High', riskColor: 'bg-obsidian-negative/10 text-obsidian-negative border-obsidian-negative/20' },
  { symbol: 'SC', name: 'Synapse Cyber', stage: 'Series A', sector: 'Post-Quantum Crypto', tam: '$12.0B', score: 93, risk: 'Low', riskColor: 'bg-obsidian-positive/10 text-obsidian-positive border-obsidian-positive/20' },
  { symbol: 'OF', name: 'Orbital Fusion', stage: 'Series B', sector: 'Clean Plasma Energy', tam: '$35.0B', score: 97, risk: 'High', riskColor: 'bg-obsidian-negative/10 text-obsidian-negative border-obsidian-negative/20' },
  { symbol: 'HG', name: 'Helix Genomics', stage: 'Seed', sector: 'AI Gene Editing', tam: '$8.1B', score: 90, risk: 'Moderate', riskColor: 'bg-obsidian-warning/10 text-obsidian-warning border-obsidian-warning/20' },
  { symbol: 'NC', name: 'NeuraLink Compute', stage: 'Series A', sector: 'BCI Data Engine', tam: '$11.4B', score: 92, risk: 'Moderate', riskColor: 'bg-obsidian-warning/10 text-obsidian-warning border-obsidian-warning/20' },
  { symbol: 'VE', name: 'Vortex Engines', stage: 'Pre-Seed', sector: 'Hypersonic Propulsion', tam: '$15.0B', score: 86, risk: 'High', riskColor: 'bg-obsidian-negative/10 text-obsidian-negative border-obsidian-negative/20' },
  { symbol: 'DL', name: 'DeepLogic AI', stage: 'Series C', sector: 'Large Reasoning Models', tam: '$45.0B', score: 98, risk: 'Low', riskColor: 'bg-obsidian-positive/10 text-obsidian-positive border-obsidian-positive/20' }
];

export const StartupsPage = {
  render() {
    return `
    <div class="space-y-4 pb-20 select-none">
      
      <!-- Top Title & Count -->
      <div class="flex items-center justify-between pt-1">
        <div>
          <h2 class="text-lg font-bold tracking-tight text-obsidian-textPrimary font-sans">
            Startup Dealflow
          </h2>
          <p class="text-xs text-obsidian-textSecondary mt-0.5 font-sans">
            12 AI-screened quantitative venture opportunities
          </p>
        </div>
        <div class="px-2.5 py-1 rounded-full bg-obsidian-card border border-obsidian-border text-[10px] font-mono text-obsidian-cyan font-semibold">
          12 Active Deals
        </div>
      </div>

      <!-- Filter Search Input (44px min height) -->
      <div class="relative flex items-center">
        <i class="ph ph-magnifying-glass text-base text-obsidian-textSecondary absolute left-3 pointer-events-none"></i>
        <input
          type="text"
          id="startupSearch"
          placeholder="Filter by sector, stage, or name..."
          class="w-full h-11 bg-obsidian-card border border-obsidian-border rounded-xl pl-9 pr-3 text-xs text-obsidian-textPrimary placeholder-obsidian-textSecondary focus:border-obsidian-cyan focus:outline-none font-sans"
        />
      </div>

      <!-- Startups as Row Items with Icon/Avatar, Name, Price and Colored Change/Score Chip -->
      <div class="space-y-2" id="startupsRowList">
        ${startupsList.map(s => `
          <div class="startup-item-row min-h-[58px] p-3 rounded-2xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/40 hover:bg-obsidian-hover flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer" data-name="${s.name}" data-sector="${s.sector}">
            <div class="flex items-center space-x-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-obsidian-bg border border-obsidian-border flex items-center justify-center font-mono text-xs font-bold text-obsidian-cyan flex-shrink-0">
                ${s.symbol}
              </div>
              <div class="min-w-0">
                <div class="flex items-center space-x-1.5">
                  <span class="text-xs font-semibold text-obsidian-textPrimary font-sans truncate">${s.name}</span>
                  <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-obsidian-bg border border-obsidian-border text-obsidian-textSecondary">${s.stage}</span>
                </div>
                <div class="text-[10px] text-obsidian-textSecondary font-mono mt-0.5 truncate">${s.sector} • TAM: ${s.tam}</div>
              </div>
            </div>

            <div class="flex items-center space-x-2 flex-shrink-0 text-right">
              <div>
                <div class="font-mono text-xs font-bold text-obsidian-brightCyan">${s.score}/100</div>
                <div class="text-[8px] font-mono text-obsidian-textSecondary uppercase">AI Score</div>
              </div>
              <span class="px-2 py-1 rounded-lg text-[10px] font-mono font-semibold border ${s.riskColor}">
                ${s.risk}
              </span>
            </div>
          </div>
        `).join('')}
      </div>

    </div>
    `;
  },

  mount() {
    document.querySelectorAll('.startup-item-row').forEach(row => {
      row.addEventListener('click', () => {
        const name = row.getAttribute('data-name');
        Toast.show(`Opened venture profile: ${name}`);
      });
    });

    const search = document.getElementById('startupSearch');
    if (search) {
      search.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('.startup-item-row').forEach(row => {
          const text = row.innerText.toLowerCase();
          row.style.display = text.includes(q) ? 'flex' : 'none';
        });
      });
    }
  }
};
