// src/pages/SettingsPage.js – Route: /settings (Mobile-First System & AI Configuration)

import { Toast } from '../components/Toast.js';

const STORAGE_MODEL_KEY = 'areos_selected_model';
const STORAGE_DEMO_KEY = 'areos_demo_mode';

export const SettingsPage = {
  healthData: null,

  async fetchHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        this.healthData = await res.json();
      }
    } catch {
      this.healthData = { status: 'offline', configured: false, model: 'unknown' };
    }
  },

  render() {
    const selectedModel = localStorage.getItem(STORAGE_MODEL_KEY) || 'gemini-2.0-flash';
    const isDemoMode = localStorage.getItem(STORAGE_DEMO_KEY) === 'true';
    const isConfigured = this.healthData?.configured;

    return `
    <div class="space-y-4 pb-20 select-none">
      
      <!-- Top Title -->
      <div class="flex items-center justify-between pt-1">
        <div>
          <h2 class="text-lg font-bold tracking-tight text-obsidian-textPrimary font-sans">
            Settings & Security
          </h2>
          <p class="text-xs text-obsidian-textSecondary mt-0.5 font-sans">
            User profile, AI model engine & proxy integration
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
        <div class="text-xs font-semibold text-obsidian-textPrimary font-sans">Gemini AI Engine</div>
        <div class="space-y-3 text-xs font-sans">
          <div>
            <label class="block text-obsidian-textSecondary mb-1 font-mono text-[11px]">Backend Proxy Connection</label>
            <div id="proxyConnectionStatus" class="p-3 rounded-xl bg-obsidian-bg border border-obsidian-border flex items-center justify-between font-mono text-xs">
              <span class="flex items-center space-x-2">
                <span class="w-2 h-2 rounded-full ${isConfigured ? 'bg-obsidian-positive' : 'bg-obsidian-warning'}"></span>
                <span class="text-obsidian-textPrimary">${isConfigured ? 'CONNECTED TO GEMINI' : 'STANDBY / KEY PENDING'}</span>
              </span>
              <span class="text-[10px] text-obsidian-textSecondary">/api/chat</span>
            </div>
          </div>

          <div>
            <label class="block text-obsidian-textSecondary mb-1 font-mono text-[11px]">Model Selection</label>
            <select id="selectModelEngine" class="w-full h-11 bg-obsidian-bg border border-obsidian-border rounded-xl px-3 text-obsidian-textPrimary font-mono focus:border-obsidian-cyan focus:outline-none">
              <option value="gemini-2.0-flash" ${selectedModel === 'gemini-2.0-flash' ? 'selected' : ''}>Gemini 2.0 Flash (Recommended, Ultra Low Latency)</option>
              <option value="gemini-2.5-flash" ${selectedModel === 'gemini-2.5-flash' ? 'selected' : ''}>Gemini 2.5 Flash (Adaptive Quantitative Thinking)</option>
              <option value="gemini-2.0-pro" ${selectedModel === 'gemini-2.0-pro' ? 'selected' : ''}>Gemini 2.0 Pro (Deep Venture & Macro Reasoning)</option>
            </select>
            <p class="text-[10px] text-obsidian-textSecondary mt-1 font-mono">
              Note: gemini-1.5-* models are retired. All calls route securely via backend proxy.
            </p>
          </div>

          <!-- Demo Mode Switch -->
          <div class="pt-2 border-t border-obsidian-border/50 flex items-center justify-between">
            <div>
              <div class="text-xs font-medium text-obsidian-textPrimary font-sans">Demo Mode</div>
              <div class="text-[10px] text-obsidian-textSecondary font-sans mt-0.5 max-w-[240px]">
                Simulate natural conversational responses with mock tools without an external key.
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="toggleDemoMode" class="sr-only peer" ${isDemoMode ? 'checked' : ''}>
              <div class="w-11 h-6 bg-obsidian-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-obsidian-aiPurple"></div>
            </label>
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

  async mount() {
    await this.fetchHealth();
    const select = document.getElementById('selectModelEngine');
    const demoToggle = document.getElementById('toggleDemoMode');
    const btn = document.getElementById('btnSaveSettings');

    if (btn) {
      btn.addEventListener('click', () => {
        if (select) {
          localStorage.setItem(STORAGE_MODEL_KEY, select.value);
        }
        if (demoToggle) {
          localStorage.setItem(STORAGE_DEMO_KEY, demoToggle.checked ? 'true' : 'false');
        }
        Toast.show('Settings and AI preferences saved.');
      });
    }
  }
};
