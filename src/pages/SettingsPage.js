// src/pages/SettingsPage.js – Route: /settings (Mobile-First System & AI Configuration)

import { Toast } from '../components/Toast.js';

export const SettingsPage = {
  render() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
    const hasKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY';

    return `
    <div class="space-y-4 pb-20 select-none">
      
      <!-- Top Title -->
      <div class="flex items-center justify-between pt-1">
        <div>
          <h2 class="text-lg font-bold tracking-tight text-obsidian-textPrimary font-sans">
            Settings & Security
          </h2>
          <p class="text-xs text-obsidian-textSecondary mt-0.5 font-sans">
            User profile, AI model engine & API integration
          </p>
        </div>
        <div class="px-2.5 py-1 rounded-full bg-obsidian-card border border-obsidian-border text-[10px] font-mono text-obsidian-cyan font-semibold">
          AES-256
        </div>
      </div>

      <!-- User Profile Card -->
      <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-4 space-y-3">
        <div class="text-xs font-semibold text-obsidian-textPrimary font-sans">User Profile</div>
        <div class="space-y-3 text-xs font-sans">
          <div>
            <label class="block text-obsidian-textSecondary mb-1 font-mono text-[11px]">Full Name</label>
            <input
              type="text"
              id="profileFullName"
              value="Alexander Wright"
              class="w-full h-11 bg-obsidian-bg border border-obsidian-border rounded-xl px-3.5 text-obsidian-textPrimary font-sans focus:border-obsidian-cyan focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-obsidian-textSecondary mb-1 font-mono text-[11px]">Account Tier</label>
            <div class="h-11 bg-obsidian-bg border border-obsidian-border rounded-xl px-3.5 flex items-center justify-between font-mono text-xs text-obsidian-textSecondary">
              <span>Institutional Pro</span>
              <span class="text-obsidian-positive text-[10px]">VERIFIED</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Gemini AI Integration Card -->
      <div class="bg-obsidian-card border border-obsidian-border rounded-2xl p-4 space-y-3">
        <div class="text-xs font-semibold text-obsidian-textPrimary font-sans">Gemini AI Configuration</div>
        <div class="space-y-3 text-xs font-sans">
          <div>
            <label class="block text-obsidian-textSecondary mb-1 font-mono text-[11px]">API Connection Status</label>
            <div class="p-3 rounded-xl bg-obsidian-bg border border-obsidian-border flex items-center justify-between font-mono text-xs">
              <span class="flex items-center space-x-2">
                <span class="w-2 h-2 rounded-full ${hasKey ? 'bg-obsidian-positive' : 'bg-obsidian-warning'}"></span>
                <span class="text-obsidian-textPrimary">${hasKey ? 'CONNECTED' : 'STANDBY (MOCK ENGINE)'}</span>
              </span>
              <span class="text-[10px] text-obsidian-textSecondary">gemini-1.5-flash</span>
            </div>
          </div>

          <div>
            <label class="block text-obsidian-textSecondary mb-1 font-mono text-[11px]">Model Selection</label>
            <select class="w-full h-11 bg-obsidian-bg border border-obsidian-border rounded-xl px-3 text-obsidian-textPrimary font-mono focus:border-obsidian-cyan focus:outline-none">
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra Low Latency)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Quantitative Reasoning)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Save Button (Min 44px tap target) -->
      <div class="pt-2">
        <button id="btnSaveSettings" class="w-full min-h-[44px] rounded-xl bg-obsidian-cyan text-black font-semibold text-xs hover:bg-obsidian-brightCyan active:scale-95 transition-all shadow-md">
          Save Preferences
        </button>
      </div>

    </div>
    `;
  },

  mount() {
    const btn = document.getElementById('btnSaveSettings');
    if (btn) {
      btn.addEventListener('click', () => {
        Toast.show('Settings saved successfully.');
      });
    }
  }
};
