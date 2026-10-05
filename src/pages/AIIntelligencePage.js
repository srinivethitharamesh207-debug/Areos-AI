// src/pages/AIIntelligencePage.js – Full-Screen AI Intelligence Assistant
// Powered by real SSE backend streaming, function calling tools, and dynamic suggestions.

import { parseMarkdown } from '../utils/markdown.js';
import { sendMessage } from '../services/chatService.js';
import { Toast } from '../components/Toast.js';

const STORAGE_CONVERSATIONS_KEY = 'areos_ai_conversations_v3';
const STORAGE_ACTIVE_ID_KEY = 'areos_ai_active_conv_id_v3';

export const AIIntelligencePage = {
  currentTab: 'chat', // 'chat' | 'insights'
  conversations: [],
  activeConversationId: null,
  isReplying: false,
  activeStatusMessage: null, // e.g. "Using portfolio data..."
  abortController: null,
  attachedFiles: [], // array of { name, size, mimeType, base64 }
  historyFilter: '',
  recognition: null,
  isRecordingVoice: false,

  // Generate unique conversation ID
  generateId() {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  },

  // Get active conversation object
  getActiveConversation() {
    let conv = this.conversations.find(c => c.id === this.activeConversationId);
    if (!conv) {
      conv = {
        id: this.generateId(),
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: []
      };
      this.conversations.unshift(conv);
      this.activeConversationId = conv.id;
      this.saveConversations();
    }
    return conv;
  },

  // Load from localStorage
  loadConversations() {
    try {
      const data = localStorage.getItem(STORAGE_CONVERSATIONS_KEY);
      if (data) {
        this.conversations = JSON.parse(data);
      } else {
        this.conversations = [];
      }
    } catch {
      this.conversations = [];
    }

    const savedActiveId = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
    if (savedActiveId && this.conversations.some(c => c.id === savedActiveId)) {
      this.activeConversationId = savedActiveId;
    } else if (this.conversations.length > 0) {
      this.activeConversationId = this.conversations[0].id;
    } else {
      this.activeConversationId = null;
    }
  },

  // Save to localStorage
  saveConversations() {
    try {
      localStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(this.conversations));
      if (this.activeConversationId) {
        localStorage.setItem(STORAGE_ACTIVE_ID_KEY, this.activeConversationId);
      }
    } catch (e) {
      console.warn('Could not save conversations to localStorage:', e);
    }
  },

  // Start fresh chat
  startNewChat() {
    if (this.isReplying && this.abortController) {
      this.abortController.abort();
    }
    const newConv = {
      id: this.generateId(),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    this.conversations.unshift(newConv);
    this.activeConversationId = newConv.id;
    this.attachedFiles = [];
    this.activeStatusMessage = null;
    this.saveConversations();
    this.currentTab = 'chat';
    this.renderActiveView();
    Toast.show('Started a new AI conversation.');
  },

  // Time-based greeting helper
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  },

  // Top Full Screen Container Render
  render() {
    return `
    <div class="relative flex flex-col h-[calc(100vh-60px)] min-h-0 bg-obsidian-bg text-obsidian-textPrimary select-none overflow-hidden font-sans">
      
      <!-- Top Action Bar inside AI Page -->
      <div class="flex items-center justify-between px-3 py-2 border-b border-obsidian-border bg-obsidian-card/40 backdrop-blur-md z-20 flex-shrink-0">
        <!-- Left: History Drawer Button -->
        <button id="btnOpenHistoryDrawer" class="min-h-[38px] px-2.5 rounded-xl bg-obsidian-card border border-obsidian-border text-obsidian-textSecondary hover:text-obsidian-textPrimary hover:border-obsidian-cyan/40 text-xs font-sans flex items-center space-x-1.5 active:scale-95 transition-all" title="View conversation history">
          <i class="ph ph-clock-counter-clockwise text-base text-obsidian-cyan"></i>
          <span class="font-medium text-xs hidden sm:inline">History</span>
        </button>

        <!-- Center: Segmented Control Tabs (Chat vs Insights) -->
        <div class="flex items-center bg-obsidian-card p-1 rounded-xl border border-obsidian-border text-xs font-medium">
          <button id="tabSegmentChat" class="px-3.5 py-1 rounded-lg bg-obsidian-bg text-obsidian-cyan shadow-sm border border-obsidian-border transition-all">
            Chat
          </button>
          <button id="tabSegmentInsights" class="px-3.5 py-1 rounded-lg text-obsidian-textSecondary hover:text-obsidian-textPrimary transition-all">
            Insights
          </button>
        </div>

        <!-- Right: New Chat Button -->
        <button id="btnHeaderNewChat" class="min-h-[38px] px-2.5 rounded-xl bg-obsidian-card border border-obsidian-border text-obsidian-textSecondary hover:text-obsidian-textPrimary hover:border-obsidian-cyan/40 text-xs font-sans flex items-center space-x-1.5 active:scale-95 transition-all" title="Start a fresh chat">
          <i class="ph ph-plus text-base text-obsidian-aiPurple"></i>
          <span class="font-medium text-xs hidden sm:inline">New Chat</span>
        </button>
      </div>

      <!-- Main Content Area: Chat Section OR Insights Section -->
      <div class="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        
        <!-- 1. CHAT FULL-SCREEN VIEW -->
        <div id="viewChatSection" class="${this.currentTab === 'chat' ? 'flex' : 'hidden'} flex-col flex-1 h-full min-h-0">
          
          <!-- Scrollable Messages Container -->
          <div id="aiScrollArea" class="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 min-h-0 scroll-smooth">
            <!-- Messages rendered dynamically -->
          </div>

          <!-- Scroll-to-bottom Floating Button -->
          <div class="relative flex justify-center pointer-events-none">
            <button id="btnScrollToBottom" class="hidden pointer-events-auto absolute -top-12 px-3 py-1.5 rounded-full bg-obsidian-card/90 border border-obsidian-cyan/50 text-obsidian-cyan shadow-xl text-xs font-mono flex items-center space-x-1.5 backdrop-blur-md active:scale-95 transition-all">
              <i class="ph ph-arrow-down text-sm"></i>
              <span>Latest</span>
            </button>
          </div>

          <!-- Bottom Chat Input Dock -->
          <div id="aiInputDock" class="flex-shrink-0 px-3 pb-3 pt-2 bg-gradient-to-t from-obsidian-bg via-obsidian-bg/95 to-transparent z-10 transition-transform duration-200">
            
            <!-- Attached Files Preview Chips Container -->
            <div id="attachedFilesContainer" class="hidden flex flex-wrap gap-1.5 mb-2 px-1">
              <!-- Dynamically populated -->
            </div>

            <!-- Floating Card Input with Subtle Glow Border -->
            <div class="relative bg-obsidian-card border border-obsidian-border rounded-2xl p-2.5 shadow-[0_4px_25px_rgba(0,0,0,0.5)] focus-within:border-obsidian-cyan/60 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all">
              
              <!-- Auto-expanding Textarea -->
              <textarea
                id="aiPromptInput"
                rows="1"
                placeholder="Ask about markets, portfolio risk, or startup screening..."
                class="w-full bg-transparent text-xs sm:text-sm text-obsidian-textPrimary placeholder-obsidian-textSecondary focus:outline-none resize-none font-sans leading-relaxed max-h-36"
              ></textarea>

              <!-- Controls Bottom Row inside same card -->
              <div class="flex items-center justify-between mt-2 pt-1">
                <!-- Left: Plus Attachment Button -->
                <div class="relative">
                  <button id="btnAttachMenu" type="button" class="w-8 h-8 rounded-full flex items-center justify-center text-obsidian-textSecondary hover:text-obsidian-textPrimary hover:bg-obsidian-bg active:scale-95 transition-all" title="Attach file or context">
                    <i class="ph ph-plus text-lg"></i>
                  </button>

                  <!-- Hidden Real File Input -->
                  <input type="file" id="aiFileInput" accept="image/*,application/pdf" multiple class="hidden" />

                  <!-- Attach Popup Sheet -->
                  <div id="attachPopup" class="hidden absolute bottom-10 left-0 bg-obsidian-sidebar border border-obsidian-border rounded-xl p-2 shadow-2xl space-y-1 w-48 text-xs font-sans z-30">
                    <button class="attach-opt-btn w-full px-2.5 py-1.5 rounded-lg hover:bg-obsidian-card text-left flex items-center space-x-2 text-obsidian-textPrimary" data-type="upload">
                      <i class="ph ph-file-text text-obsidian-cyan text-base"></i>
                      <span>Upload Image / PDF</span>
                    </button>
                    <button class="attach-opt-btn w-full px-2.5 py-1.5 rounded-lg hover:bg-obsidian-card text-left flex items-center space-x-2 text-obsidian-textPrimary" data-type="context-portfolio">
                      <i class="ph ph-chart-pie-slice text-obsidian-aiPurple text-base"></i>
                      <span>Attach Portfolio State</span>
                    </button>
                    <button class="attach-opt-btn w-full px-2.5 py-1.5 rounded-lg hover:bg-obsidian-card text-left flex items-center space-x-2 text-obsidian-textPrimary" data-type="context-markets">
                      <i class="ph ph-chart-line-up text-obsidian-cyan text-base"></i>
                      <span>Attach Market Ticker</span>
                    </button>
                  </div>
                </div>

                <!-- Right: Action Button (Microphone -> ArrowUp -> Stop) -->
                <div class="flex items-center space-x-2">
                  <button
                    id="btnChatAction"
                    type="button"
                    class="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 text-obsidian-textSecondary hover:text-obsidian-cyan"
                    title="Voice input"
                  >
                    <i id="chatActionIcon" class="ph ph-microphone text-lg"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Disclaimer Under Input -->
            <div class="text-center text-[10px] text-obsidian-textSecondary/70 mt-1.5 select-none font-sans">
              Areos AI is a conversational market intelligence co-pilot. Not licensed financial advice.
            </div>
          </div>
        </div>

        <!-- 2. INSIGHTS VERTICAL LIST VIEW -->
        <div id="viewInsightsSection" class="${this.currentTab === 'insights' ? 'flex' : 'hidden'} flex-col flex-1 h-full min-h-0 overflow-y-auto p-4 space-y-4">
          <div class="text-xs font-mono uppercase tracking-wider text-obsidian-textSecondary">Active Macro & Risk Insights</div>
          
          <!-- Insight Card 1: Market Outlook -->
          <div class="bg-obsidian-card border border-obsidian-aiPurple/30 rounded-xl p-4 space-y-2 hover:border-obsidian-aiPurple/50 transition-all">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-obsidian-aiPurple/10 text-obsidian-aiPurple border border-obsidian-aiPurple/20 font-semibold">Market Outlook</span>
              <span class="text-[10px] font-mono text-obsidian-positive">High Confidence</span>
            </div>
            <h3 class="text-sm font-semibold text-obsidian-textPrimary font-sans">Improving Macro Momentum</h3>
            <p class="text-xs text-obsidian-textSecondary leading-relaxed">
              AI detects improving market momentum with moderate volatility across technology and semiconductor supply chains. Q3 easing outlook supports trailing index expansion.
            </p>
            <div class="pt-2 border-t border-obsidian-border/50 flex items-center justify-between">
              <span class="text-[10px] font-mono text-obsidian-textSecondary">Model: Macro-Quant-v2</span>
              <button class="btn-ask-insight px-2.5 py-1 rounded bg-obsidian-bg border border-obsidian-border hover:border-obsidian-cyan text-obsidian-cyan text-[11px] font-medium flex items-center space-x-1" data-query="Explain the improving macro momentum in detail">
                <span>Ask AI</span>
                <i class="ph ph-arrow-up-right text-xs"></i>
              </button>
            </div>
          </div>

          <!-- Insight Card 2: Portfolio Risk Alert -->
          <div class="bg-obsidian-card border border-obsidian-warning/30 rounded-xl p-4 space-y-2 hover:border-obsidian-warning/50 transition-all">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-obsidian-warning/10 text-obsidian-warning border border-obsidian-warning/20 font-semibold">Portfolio Risk Alert</span>
              <span class="text-[10px] font-mono text-obsidian-warning">Actionable</span>
            </div>
            <h3 class="text-sm font-semibold text-obsidian-textPrimary font-sans">Tech Concentration Spike</h3>
            <p class="text-xs text-obsidian-textSecondary leading-relaxed">
              Technology exposure (54%) exceeds recommended portfolio risk guidelines (max 40%). Rebalancing $2,500 into fixed-income or defensive dividend ETFs is recommended to preserve alpha.
            </p>
            <div class="pt-2 border-t border-obsidian-border/50 flex items-center justify-between">
              <span class="text-[10px] font-mono text-obsidian-textSecondary">Sector Weight: 54% (NVDA 34%)</span>
              <button class="btn-ask-insight px-2.5 py-1 rounded bg-obsidian-bg border border-obsidian-border hover:border-obsidian-cyan text-obsidian-cyan text-[11px] font-medium flex items-center space-x-1" data-query="How should I rebalance my portfolio tech concentration?">
                <span>Ask AI</span>
                <i class="ph ph-arrow-up-right text-xs"></i>
              </button>
            </div>
          </div>

          <!-- Insight Card 3: Opportunity Scanner -->
          <div class="bg-obsidian-card border border-obsidian-cyan/30 rounded-xl p-4 space-y-2 hover:border-obsidian-cyan/50 transition-all">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-obsidian-cyan/10 text-obsidian-cyan border border-obsidian-cyan/20 font-semibold">Opportunity Scanner</span>
              <span class="text-[10px] font-mono text-obsidian-cyan">12 Matches</span>
            </div>
            <h3 class="text-sm font-semibold text-obsidian-textPrimary font-sans">Venture Dealflow Qualified</h3>
            <p class="text-xs text-obsidian-textSecondary leading-relaxed">
              12 institutional-grade early-stage startups screened this cycle with high quantitative validation scores (QuantumFlux 96, NeuroQubits 94).
            </p>
            <div class="pt-2 border-t border-obsidian-border/50 flex items-center justify-between">
              <span class="text-[10px] font-mono text-obsidian-textSecondary">Database: Areos Venture Engine</span>
              <button class="btn-ask-insight px-2.5 py-1 rounded bg-obsidian-bg border border-obsidian-border hover:border-obsidian-cyan text-obsidian-cyan text-[11px] font-medium flex items-center space-x-1" data-query="Give me a venture briefing on the top early-stage deals">
                <span>Ask AI</span>
                <i class="ph ph-arrow-up-right text-xs"></i>
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Slide-Over Left History Drawer -->
      <div id="aiHistoryDrawerBackdrop" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200 opacity-0 flex">
        <div id="aiHistoryDrawerPanel" class="w-80 max-w-[85vw] h-full bg-obsidian-sidebar border-r border-obsidian-border shadow-2xl flex flex-col transform -translate-x-full transition-transform duration-200">
          <!-- Drawer Header -->
          <div class="p-3.5 border-b border-obsidian-border flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i class="ph ph-clock-counter-clockwise text-obsidian-cyan text-lg"></i>
              <span class="font-bold text-sm font-sans text-obsidian-textPrimary">Chat History</span>
            </div>
            <button id="btnCloseHistoryDrawer" class="w-8 h-8 rounded-lg flex items-center justify-center text-obsidian-textSecondary hover:text-obsidian-textPrimary hover:bg-obsidian-card">
              <i class="ph ph-x text-base"></i>
            </button>
          </div>

          <!-- Drawer Action: New Chat -->
          <div class="p-3 border-b border-obsidian-border/50">
            <button id="btnDrawerNewChat" class="w-full py-2 px-3 rounded-xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/50 text-obsidian-textPrimary text-xs font-medium flex items-center justify-center space-x-2 active:scale-95 transition-all">
              <i class="ph ph-plus text-obsidian-cyan"></i>
              <span>Start New Conversation</span>
            </button>
          </div>

          <!-- Search History -->
          <div class="px-3 pt-2">
            <div class="relative flex items-center">
              <i class="ph ph-magnifying-glass text-xs text-obsidian-textSecondary absolute left-3 pointer-events-none"></i>
              <input
                type="text"
                id="historySearchInput"
                placeholder="Search history..."
                class="w-full h-8 bg-obsidian-bg border border-obsidian-border rounded-lg pl-8 pr-3 text-xs text-obsidian-textPrimary placeholder-obsidian-textSecondary focus:border-obsidian-cyan focus:outline-none"
              />
            </div>
          </div>

          <!-- Grouped Conversations List -->
          <div id="historyConversationsList" class="flex-1 overflow-y-auto p-3 space-y-4">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- Click outside drawer to dismiss -->
        <div id="aiHistoryDismiss" class="flex-1 h-full"></div>
      </div>

    </div>
    `;
  },

  // Render chat welcome screen OR conversation messages
  renderActiveView() {
    const scrollEl = document.getElementById('aiScrollArea');
    if (!scrollEl) return;

    const conv = this.getActiveConversation();
    const hasMessages = conv.messages && conv.messages.length > 0;

    if (!hasMessages) {
      // CLAUDE HOME SCREEN STYLE WELCOME VIEW
      scrollEl.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[70vh] text-center px-2 py-6 select-none animate-fadeIn">
        <!-- Glowing Sparkle Logo Mark -->
        <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-obsidian-cyan via-obsidian-brightCyan to-obsidian-aiPurple flex items-center justify-center shadow-[0_0_35px_rgba(34,211,238,0.4)] animate-pulse">
          <i class="ph-fill ph-sparkle text-3xl sm:text-4xl text-black"></i>
        </div>

        <!-- Greeting -->
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-obsidian-textPrimary font-sans mt-5">
          ${this.getGreeting()}
        </h2>

        <!-- Subtitle -->
        <p class="text-xs sm:text-sm text-obsidian-textSecondary mt-1.5 max-w-xs font-sans">
          How can I help with your markets today?
        </p>

        <!-- 4 Suggestion Chips (2x2 Grid) -->
        <div class="grid grid-cols-2 gap-2.5 w-full max-w-sm mt-8">
          <button class="ai-welcome-chip min-h-[64px] p-3 rounded-2xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/50 hover:bg-obsidian-hover text-left flex flex-col justify-between active:scale-95 transition-all group" data-prompt="Analyze my portfolio risk">
            <i class="ph ph-chart-pie-slice text-lg text-obsidian-cyan group-hover:scale-110 transition-transform"></i>
            <span class="text-xs font-medium text-obsidian-textPrimary group-hover:text-obsidian-cyan leading-snug">Analyze my portfolio risk</span>
          </button>

          <button class="ai-welcome-chip min-h-[64px] p-3 rounded-2xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/50 hover:bg-obsidian-hover text-left flex flex-col justify-between active:scale-95 transition-all group" data-prompt="Why is sentiment bullish today?">
            <i class="ph ph-chart-line-up text-lg text-obsidian-cyan group-hover:scale-110 transition-transform"></i>
            <span class="text-xs font-medium text-obsidian-textPrimary group-hover:text-obsidian-cyan leading-snug">Why is sentiment bullish today?</span>
          </button>

          <button class="ai-welcome-chip min-h-[64px] p-3 rounded-2xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/50 hover:bg-obsidian-hover text-left flex flex-col justify-between active:scale-95 transition-all group" data-prompt="Compare S&P 500 and NIFTY 50">
            <i class="ph ph-chart-bar text-lg text-obsidian-cyan group-hover:scale-110 transition-transform"></i>
            <span class="text-xs font-medium text-obsidian-textPrimary group-hover:text-obsidian-cyan leading-snug">Compare S&P 500 and NIFTY 50</span>
          </button>

          <button class="ai-welcome-chip min-h-[64px] p-3 rounded-2xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/50 hover:bg-obsidian-hover text-left flex flex-col justify-between active:scale-95 transition-all group" data-prompt="Find promising startups this week">
            <i class="ph ph-rocket-launch text-lg text-obsidian-cyan group-hover:scale-110 transition-transform"></i>
            <span class="text-xs font-medium text-obsidian-textPrimary group-hover:text-obsidian-cyan leading-snug">Find promising startups this week</span>
          </button>
        </div>
      </div>
      `;
    } else {
      // CONVERSATION VIEW
      let html = '';

      conv.messages.forEach((m, idx) => {
        const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        if (m.role === 'user') {
          html += `
          <div class="flex justify-end mb-4 animate-fadeIn">
            <div class="max-w-[85%] sm:max-w-[80%]">
              <div class="bg-obsidian-cyan/15 border border-obsidian-cyan/30 text-obsidian-textPrimary rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans shadow-md">
                ${m.content}
                ${m.attachments && m.attachments.length > 0 ? `
                  <div class="flex flex-wrap gap-1 mt-2 pt-2 border-t border-obsidian-cyan/20">
                    ${m.attachments.map(att => `
                      <span class="text-[10px] font-mono text-obsidian-cyan bg-obsidian-bg/80 px-2 py-0.5 rounded flex items-center space-x-1">
                        <i class="ph ph-paperclip"></i>
                        <span>${att.name || 'attachment'}</span>
                      </span>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
              <div class="text-[9px] font-mono text-obsidian-textSecondary mt-1 text-right">${timeStr}</div>
            </div>
          </div>
          `;
        } else if (m.role === 'assistant') {
          const parsed = parseMarkdown(m.content || '');
          const isLatest = idx === conv.messages.length - 1;

          html += `
          <div class="flex items-start space-x-2.5 mb-5 group animate-fadeIn">
            <!-- Small Sparkle Avatar (Purple) -->
            <div class="w-6 h-6 rounded-md bg-obsidian-aiPurple/15 border border-obsidian-aiPurple/30 flex items-center justify-center text-obsidian-aiPurple flex-shrink-0 mt-0.5 shadow-sm">
              <i class="ph-fill ph-sparkle text-xs"></i>
            </div>

            <!-- AI Message: Plain Text on Dark Background (No Heavy Bubble) -->
            <div class="flex-1 min-w-0 pr-1">
              <div class="text-xs sm:text-sm text-obsidian-textPrimary leading-relaxed font-sans space-y-2">
                ${parsed}
              </div>

              <!-- Message Actions Row: Copy, ThumbsUp, ThumbsDown, Regenerate -->
              <div class="flex items-center space-x-3 mt-2.5 text-obsidian-textSecondary text-xs">
                <button class="btn-msg-copy hover:text-obsidian-cyan flex items-center space-x-1 active:scale-95 transition-all" data-msg-idx="${idx}" title="Copy message">
                  <i class="ph ph-copy text-sm"></i>
                  <span class="text-[10px] font-mono">Copy</span>
                </button>
                <button class="btn-msg-like hover:text-obsidian-cyan flex items-center space-x-1 active:scale-95 transition-all" data-msg-idx="${idx}" title="Good response">
                  <i class="ph ph-thumbs-up text-sm"></i>
                </button>
                <button class="btn-msg-dislike hover:text-obsidian-negative flex items-center space-x-1 active:scale-95 transition-all" data-msg-idx="${idx}" title="Poor response">
                  <i class="ph ph-thumbs-down text-sm"></i>
                </button>
                <button class="btn-msg-regen hover:text-obsidian-cyan flex items-center space-x-1 active:scale-95 transition-all" data-msg-idx="${idx}" title="Regenerate reply">
                  <i class="ph ph-arrows-clockwise text-sm"></i>
                </button>
              </div>

              <!-- Dynamic Follow-up Suggestion Chips after Latest Reply -->
              ${isLatest && !this.isReplying && m.followups && m.followups.length > 0 ? `
                <div class="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-obsidian-border/30">
                  ${m.followups.map(chip => `
                    <button class="ai-followup-chip px-2.5 py-1 rounded-full bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan text-[11px] font-sans text-obsidian-textSecondary hover:text-obsidian-cyan active:scale-95 transition-all" data-prompt="${chip}">
                      ${chip}
                    </button>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
          `;
        } else if (m.role === 'error') {
          // CLEAR INLINE OFFLINE ERROR STATE WITH RETRY
          html += `
          <div class="flex items-start space-x-2.5 mb-4 animate-fadeIn">
            <div class="w-6 h-6 rounded-md bg-obsidian-negative/15 border border-obsidian-negative/30 flex items-center justify-center text-obsidian-negative flex-shrink-0 mt-0.5">
              <i class="ph ph-warning-circle text-xs"></i>
            </div>
            <div class="flex-1 bg-obsidian-card border border-obsidian-negative/40 rounded-xl p-3 text-xs space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-obsidian-negative font-semibold font-sans text-xs">Areos AI is offline</span>
                <span class="text-[9px] font-mono text-obsidian-textSecondary px-1.5 py-0.5 rounded bg-obsidian-bg border border-obsidian-border">API Error</span>
              </div>
              <div class="text-obsidian-textSecondary leading-relaxed">${m.content}</div>
              <div class="pt-1">
                <button class="btn-retry-inference px-3 py-1 rounded-lg bg-obsidian-negative/20 border border-obsidian-negative/40 text-obsidian-negative hover:bg-obsidian-negative/30 text-[11px] font-mono font-semibold flex items-center space-x-1 active:scale-95 transition-all" data-msg-idx="${idx}">
                  <i class="ph ph-arrows-clockwise text-xs"></i>
                  <span>Retry</span>
                </button>
              </div>
            </div>
          </div>
          `;
        }
      });

      // Tool status chip ("Using portfolio data...") & Typing Indicator
      if (this.isReplying) {
        if (this.activeStatusMessage) {
          html += `
          <div class="flex items-center space-x-2 px-3 py-1 rounded-full bg-obsidian-card border border-obsidian-aiPurple/40 text-[11px] font-mono text-obsidian-aiPurple w-fit mb-2 animate-fadeIn">
            <i class="ph ph-gear animate-spin text-sm"></i>
            <span>${this.activeStatusMessage}</span>
          </div>
          `;
        }

        html += `
        <div id="aiTypingIndicator" class="flex items-start space-x-2.5 mb-4 animate-fadeIn">
          <div class="w-6 h-6 rounded-md bg-obsidian-aiPurple/15 border border-obsidian-aiPurple/30 flex items-center justify-center text-obsidian-aiPurple flex-shrink-0 mt-0.5">
            <i class="ph ph-sparkle text-xs animate-spin"></i>
          </div>
          <div class="flex items-center space-x-1.5 py-2">
            <span class="w-1.5 h-1.5 rounded-full bg-obsidian-aiPurple animate-bounce"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-obsidian-aiPurple animate-bounce [animation-delay:0.2s]"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-obsidian-aiPurple animate-bounce [animation-delay:0.4s]"></span>
          </div>
        </div>
        `;
      }

      scrollEl.innerHTML = html;
    }

    this.scrollToBottom();
    this.updateChatActionButton();
  },

  scrollToBottom(smooth = false) {
    requestAnimationFrame(() => {
      const scrollEl = document.getElementById('aiScrollArea');
      if (scrollEl) {
        if (smooth) {
          scrollEl.scrollTo({ top: scrollEl.scrollHeight + 100, behavior: 'smooth' });
        } else {
          scrollEl.scrollTop = scrollEl.scrollHeight + 100;
        }
      }
    });
  },

  // Update send / voice / stop button state
  updateChatActionButton() {
    const input = document.getElementById('aiPromptInput');
    const btn = document.getElementById('btnChatAction');
    const icon = document.getElementById('chatActionIcon');
    if (!btn || !icon) return;

    if (this.isReplying) {
      // STOP BUTTON
      btn.className = 'w-8 h-8 rounded-full bg-obsidian-negative text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-md';
      icon.className = 'ph-fill ph-stop text-sm';
      btn.title = 'Stop generating';
    } else if (this.isRecordingVoice) {
      // RECORDING ACTIVE PULSE
      btn.className = 'w-8 h-8 rounded-full bg-obsidian-negative text-white flex items-center justify-center animate-pulse';
      icon.className = 'ph-fill ph-microphone text-base';
      btn.title = 'Listening... click to finish';
    } else {
      const hasText = (input && input.value.trim().length > 0) || this.attachedFiles.length > 0;
      if (hasText) {
        // CYAN SEND BUTTON
        btn.className = 'w-8 h-8 rounded-full bg-obsidian-cyan text-black flex items-center justify-center hover:bg-obsidian-brightCyan active:scale-95 transition-all shadow-md';
        icon.className = 'ph-bold ph-arrow-up text-base';
        btn.title = 'Send query';
      } else {
        // MICROPHONE BUTTON
        btn.className = 'w-8 h-8 rounded-full flex items-center justify-center text-obsidian-textSecondary hover:text-obsidian-cyan active:scale-95 transition-all';
        icon.className = 'ph ph-microphone text-lg';
        btn.title = 'Voice input';
      }
    }
  },

  // Real SpeechRecognition handler
  startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Toast.show('Speech recognition is not supported in this browser.');
      return;
    }

    if (this.recognition && this.isRecordingVoice) {
      this.recognition.stop();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;
      this.recognition = recognition;
      this.isRecordingVoice = true;
      this.updateChatActionButton();
      Toast.show('Listening... Speak into your microphone.');

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        const input = document.getElementById('aiPromptInput');
        if (input) {
          input.value = transcript;
          input.style.height = 'auto';
          input.style.height = Math.min(input.scrollHeight, 140) + 'px';
          this.updateChatActionButton();
        }
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error !== 'no-speech') {
          Toast.show(`Voice input: ${event.error}`);
        }
        this.stopVoiceInput();
      };

      recognition.onend = () => {
        this.stopVoiceInput();
      };

      recognition.start();
    } catch (err) {
      console.warn('Could not start voice recognition:', err);
      Toast.show('Microphone unavailable or blocked.');
      this.stopVoiceInput();
    }
  },

  stopVoiceInput() {
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
    }
    this.isRecordingVoice = false;
    this.updateChatActionButton();
  },

  // Render attachment chips
  renderAttachedChips() {
    const container = document.getElementById('attachedFilesContainer');
    if (!container) return;

    if (this.attachedFiles.length === 0) {
      container.classList.add('hidden');
      container.innerHTML = '';
      this.updateChatActionButton();
      return;
    }

    container.classList.remove('hidden');
    container.innerHTML = this.attachedFiles.map((file, idx) => `
      <span class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-obsidian-card border border-obsidian-cyan/30 text-[10px] font-mono text-obsidian-cyan">
        <i class="ph ph-paperclip text-xs"></i>
        <span>${file.name}</span>
        <button class="btn-remove-attach text-obsidian-textSecondary hover:text-obsidian-negative ml-0.5" data-idx="${idx}">
          <i class="ph ph-x text-xs"></i>
        </button>
      </span>
    `).join('');

    this.updateChatActionButton();
  },

  // Main Send Message Handler
  async handleSendPrompt(text) {
    if ((!text && this.attachedFiles.length === 0) || this.isReplying) return;

    const conv = this.getActiveConversation();
    const isFirstMessage = !conv.messages || conv.messages.length === 0;

    // Generate meaningful conversation title from the first message
    if (isFirstMessage) {
      const cleanTitle = (text || 'Market Analysis').trim().replace(/^[#\*\s]+/, '');
      conv.title = cleanTitle.length > 28 ? cleanTitle.slice(0, 28) + '...' : cleanTitle;
    }

    const currentAttachments = [...this.attachedFiles];
    this.attachedFiles = [];
    this.renderAttachedChips();

    conv.messages.push({
      role: 'user',
      content: text || 'Analyze attached context',
      attachments: currentAttachments,
      timestamp: Date.now()
    });
    conv.updatedAt = Date.now();
    this.saveConversations();

    // Clear textarea
    const input = document.getElementById('aiPromptInput');
    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }

    this.isReplying = true;
    this.activeStatusMessage = null;
    this.abortController = new AbortController();
    this.renderActiveView();

    // Placeholder AI message for streaming
    const aiMsg = {
      role: 'assistant',
      content: '',
      followups: [],
      timestamp: Date.now()
    };
    conv.messages.push(aiMsg);
    const aiMsgIdx = conv.messages.length - 1;

    const selectedModel = localStorage.getItem('areos_selected_model') || 'gemini-2.0-flash';
    const isDemoMode = localStorage.getItem('areos_demo_mode') === 'true';

    try {
      await sendMessage({
        messages: conv.messages.filter(m => m.role === 'user' || m.role === 'assistant'),
        model: selectedModel,
        demoMode: isDemoMode,
        onStatus: (statusMessage) => {
          this.activeStatusMessage = statusMessage;
          this.renderActiveView();
        },
        onChunk: (accumulatedText) => {
          this.activeStatusMessage = null; // Text arrived, clear tool pill
          conv.messages[aiMsgIdx].content = accumulatedText;
          this.renderActiveView();
        },
        onFollowups: (followupList) => {
          conv.messages[aiMsgIdx].followups = followupList;
        },
        signal: this.abortController.signal
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        Toast.show('Inference stopped by user.');
        if (!conv.messages[aiMsgIdx].content) {
          conv.messages.splice(aiMsgIdx, 1);
        }
      } else {
        // RENDER REAL OFFLINE ERROR STATE (NO FAKE TEMPLATE)
        conv.messages[aiMsgIdx] = {
          role: 'error',
          content: err.message || 'Areos AI is offline. Unable to establish connection to AI proxy.',
          timestamp: Date.now()
        };
      }
    } finally {
      this.isReplying = false;
      this.activeStatusMessage = null;
      this.abortController = null;
      conv.updatedAt = Date.now();
      this.saveConversations();
      this.renderActiveView();
    }
  },

  // Render History Drawer List
  renderHistoryDrawer() {
    const listEl = document.getElementById('historyConversationsList');
    if (!listEl) return;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOf7Days = startOfToday - (7 * 86400000);

    const q = this.historyFilter.trim().toLowerCase();
    const filtered = this.conversations.filter(c => {
      if (!q) return true;
      return c.title.toLowerCase().includes(q);
    });

    const groups = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: []
    };

    filtered.forEach(c => {
      const time = c.updatedAt || c.createdAt || 0;
      if (time >= startOfToday) {
        groups.Today.push(c);
      } else if (time >= startOfYesterday) {
        groups.Yesterday.push(c);
      } else if (time >= startOf7Days) {
        groups['Previous 7 Days'].push(c);
      } else {
        groups.Older.push(c);
      }
    });

    let html = '';
    for (const [groupName, convs] of Object.entries(groups)) {
      if (convs.length === 0) continue;

      html += `
      <div>
        <div class="text-[10px] font-mono uppercase tracking-wider text-obsidian-textSecondary mb-1.5 px-1">${groupName}</div>
        <div class="space-y-1">
          ${convs.map(c => {
            const isActive = c.id === this.activeConversationId;
            return `
            <div class="history-item-row group flex items-center justify-between p-2 rounded-xl text-xs font-sans cursor-pointer ${isActive ? 'bg-obsidian-card border border-obsidian-cyan/40 text-obsidian-cyan' : 'hover:bg-obsidian-card text-obsidian-textSecondary hover:text-obsidian-textPrimary'} transition-all" data-id="${c.id}">
              <div class="flex items-center space-x-2 min-w-0 flex-1">
                <i class="ph ph-chat-circle text-sm flex-shrink-0 ${isActive ? 'text-obsidian-cyan' : 'text-obsidian-textSecondary'}"></i>
                <span class="truncate font-medium text-xs">${c.title || 'Untitled'}</span>
              </div>
              <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1">
                <button class="btn-rename-conv p-1 rounded hover:text-obsidian-cyan hover:bg-obsidian-bg" data-id="${c.id}" title="Rename">
                  <i class="ph ph-pencil-simple text-xs"></i>
                </button>
                <button class="btn-delete-conv p-1 rounded hover:text-obsidian-negative hover:bg-obsidian-bg" data-id="${c.id}" title="Delete">
                  <i class="ph ph-trash text-xs"></i>
                </button>
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>
      `;
    }

    if (!html) {
      html = `<div class="py-8 text-center text-xs font-mono text-obsidian-textSecondary">No conversations found</div>`;
    }

    listEl.innerHTML = html;
  },

  openHistoryDrawer() {
    const backdrop = document.getElementById('aiHistoryDrawerBackdrop');
    const panel = document.getElementById('aiHistoryDrawerPanel');
    if (backdrop && panel) {
      this.renderHistoryDrawer();
      backdrop.classList.remove('hidden');
      requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        panel.classList.remove('-translate-x-full');
      });
    }
  },

  closeHistoryDrawer() {
    const backdrop = document.getElementById('aiHistoryDrawerBackdrop');
    const panel = document.getElementById('aiHistoryDrawerPanel');
    if (backdrop && panel) {
      backdrop.classList.add('opacity-0');
      panel.classList.add('-translate-x-full');
      setTimeout(() => {
        backdrop.classList.add('hidden');
      }, 200);
    }
  },

  // Mount page handlers
  mount(prefillPrompt = '') {
    window.AIIntelligencePageInstance = this;
    window.HistoryDrawer = {
      open: () => this.openHistoryDrawer(),
      close: () => this.closeHistoryDrawer()
    };

    this.loadConversations();
    this.renderActiveView();

    const input = document.getElementById('aiPromptInput');
    const btnAction = document.getElementById('btnChatAction');
    const btnAttach = document.getElementById('btnAttachMenu');
    const fileInput = document.getElementById('aiFileInput');
    const attachPopup = document.getElementById('attachPopup');
    const scrollEl = document.getElementById('aiScrollArea');
    const btnScrollToBottom = document.getElementById('btnScrollToBottom');

    // Segmented Control Tabs
    const tabChat = document.getElementById('tabSegmentChat');
    const tabInsights = document.getElementById('tabSegmentInsights');
    const viewChat = document.getElementById('viewChatSection');
    const viewInsights = document.getElementById('viewInsightsSection');

    if (tabChat && tabInsights) {
      tabChat.addEventListener('click', () => {
        this.currentTab = 'chat';
        tabChat.className = 'px-3.5 py-1 rounded-lg bg-obsidian-bg text-obsidian-cyan shadow-sm border border-obsidian-border transition-all';
        tabInsights.className = 'px-3.5 py-1 rounded-lg text-obsidian-textSecondary hover:text-obsidian-textPrimary transition-all';
        viewChat?.classList.remove('hidden');
        viewChat?.classList.add('flex');
        viewInsights?.classList.add('hidden');
        viewInsights?.classList.remove('flex');
        this.scrollToBottom();
      });

      tabInsights.addEventListener('click', () => {
        this.currentTab = 'insights';
        tabInsights.className = 'px-3.5 py-1 rounded-lg bg-obsidian-bg text-obsidian-cyan shadow-sm border border-obsidian-border transition-all';
        tabChat.className = 'px-3.5 py-1 rounded-lg text-obsidian-textSecondary hover:text-obsidian-textPrimary transition-all';
        viewInsights?.classList.remove('hidden');
        viewInsights?.classList.add('flex');
        viewChat?.classList.add('hidden');
        viewChat?.classList.remove('flex');
      });
    }

    // Auto-grow textarea
    if (input) {
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 140) + 'px';
        this.updateChatActionButton();
      });

      // Enter to send on Desktop, new line on Mobile or with Shift
      const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (isMobile) return;
          if (!e.shiftKey) {
            e.preventDefault();
            const text = input.value.trim();
            if (text || this.attachedFiles.length > 0) {
              this.handleSendPrompt(text);
            }
          }
        }
      });

      if (prefillPrompt) {
        input.value = prefillPrompt;
        this.updateChatActionButton();
        input.focus();
      }
    }

    // Chat Action Button (Send / Stop / Voice)
    if (btnAction) {
      btnAction.addEventListener('click', () => {
        if (this.isReplying) {
          if (this.abortController) this.abortController.abort();
        } else if (this.isRecordingVoice) {
          this.stopVoiceInput();
        } else {
          const text = input ? input.value.trim() : '';
          if (text || this.attachedFiles.length > 0) {
            this.handleSendPrompt(text);
          } else {
            this.startVoiceInput();
          }
        }
      });
    }

    // Attach Menu Toggle
    if (btnAttach && attachPopup) {
      btnAttach.addEventListener('click', (e) => {
        e.stopPropagation();
        attachPopup.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!attachPopup.contains(e.target) && e.target !== btnAttach) {
          attachPopup.classList.add('hidden');
        }
      });

      // Attach Options
      document.querySelectorAll('.attach-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.getAttribute('data-type');
          attachPopup.classList.add('hidden');

          if (type === 'upload') {
            fileInput?.click();
          } else if (type === 'context-portfolio') {
            this.attachedFiles.push({
              name: 'portfolio_state.json',
              mimeType: 'application/json',
              base64: btoa(JSON.stringify({ value: '$48,281.42', sharpe: 2.48, holdings: ['NVDA', 'AAPL', 'VOO', 'BTC'] }))
            });
            this.renderAttachedChips();
            Toast.show('Attached portfolio context snapshot.');
          } else if (type === 'context-markets') {
            this.attachedFiles.push({
              name: 'market_indices.json',
              mimeType: 'application/json',
              base64: btoa(JSON.stringify({ SP500: '5842.10', NIFTY: '25182.40', NASDAQ: '18340.65' }))
            });
            this.renderAttachedChips();
            Toast.show('Attached market indices snapshot.');
          }
        });
      });
    }

    // Real File Input Change (Base64 file reader)
    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
          try {
            const base64Data = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const res = reader.result;
                const base64 = typeof res === 'string' ? res.split(',')[1] : '';
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            this.attachedFiles.push({
              name: file.name,
              size: file.size,
              mimeType: file.type || 'application/octet-stream',
              base64: base64Data
            });
            Toast.show(`Uploaded: ${file.name}`);
          } catch (err) {
            console.error('File read error:', err);
            Toast.show(`Failed to read file ${file.name}`);
          }
        }
        fileInput.value = '';
        this.renderAttachedChips();
      });
    }

    // Scroll to bottom detection
    if (scrollEl && btnScrollToBottom) {
      scrollEl.addEventListener('scroll', () => {
        const distanceFromBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
        if (distanceFromBottom > 120) {
          btnScrollToBottom.classList.remove('hidden');
        } else {
          btnScrollToBottom.classList.add('hidden');
        }
      });

      btnScrollToBottom.addEventListener('click', () => {
        this.scrollToBottom(true);
      });
    }

    // Header buttons
    const btnOpenHistory = document.getElementById('btnOpenHistoryDrawer');
    const btnNewChat = document.getElementById('btnHeaderNewChat');
    if (btnOpenHistory) btnOpenHistory.addEventListener('click', () => this.openHistoryDrawer());
    if (btnNewChat) btnNewChat.addEventListener('click', () => this.startNewChat());

    // History Drawer listeners
    const btnCloseHistory = document.getElementById('btnCloseHistoryDrawer');
    const dismissHistory = document.getElementById('aiHistoryDismiss');
    const btnDrawerNewChat = document.getElementById('btnDrawerNewChat');
    const searchHistoryInput = document.getElementById('historySearchInput');

    if (btnCloseHistory) btnCloseHistory.addEventListener('click', () => this.closeHistoryDrawer());
    if (dismissHistory) dismissHistory.addEventListener('click', () => this.closeHistoryDrawer());
    if (btnDrawerNewChat) {
      btnDrawerNewChat.addEventListener('click', () => {
        this.closeHistoryDrawer();
        this.startNewChat();
      });
    }

    if (searchHistoryInput) {
      searchHistoryInput.addEventListener('input', (e) => {
        this.historyFilter = e.target.value;
        this.renderHistoryDrawer();
      });
    }

    // Delegated Clicks (chips, copy, like, retry, history delete/rename, insights ask)
    document.addEventListener('click', (e) => {
      // 1. Welcome chips
      const welcomeChip = e.target.closest('.ai-welcome-chip');
      if (welcomeChip) {
        const p = welcomeChip.getAttribute('data-prompt');
        if (p) this.handleSendPrompt(p);
        return;
      }

      // 2. Follow-up chips
      const followupChip = e.target.closest('.ai-followup-chip');
      if (followupChip) {
        const p = followupChip.getAttribute('data-prompt');
        if (p) this.handleSendPrompt(p);
        return;
      }

      // 3. Remove attachment chip
      const removeAttach = e.target.closest('.btn-remove-attach');
      if (removeAttach) {
        const idx = parseInt(removeAttach.getAttribute('data-idx'), 10);
        if (!isNaN(idx)) {
          this.attachedFiles.splice(idx, 1);
          this.renderAttachedChips();
        }
        return;
      }

      // 4. Copy Message
      const copyBtn = e.target.closest('.btn-msg-copy');
      if (copyBtn) {
        const idx = parseInt(copyBtn.getAttribute('data-msg-idx'), 10);
        const conv = this.getActiveConversation();
        if (conv.messages[idx]) {
          navigator.clipboard.writeText(conv.messages[idx].content || '');
          Toast.show('AI response copied to clipboard.');
        }
        return;
      }

      // 5. Like / Dislike Message
      const likeBtn = e.target.closest('.btn-msg-like');
      if (likeBtn) {
        likeBtn.classList.toggle('text-obsidian-cyan');
        Toast.show('Feedback recorded: Helpful response.');
        return;
      }

      const dislikeBtn = e.target.closest('.btn-msg-dislike');
      if (dislikeBtn) {
        dislikeBtn.classList.toggle('text-obsidian-negative');
        Toast.show('Feedback recorded: Reported issue.');
        return;
      }

      // 6. Regenerate Message
      const regenBtn = e.target.closest('.btn-msg-regen');
      if (regenBtn) {
        const conv = this.getActiveConversation();
        const lastUser = [...conv.messages].reverse().find(m => m.role === 'user');
        if (lastUser) {
          this.handleSendPrompt(lastUser.content);
        }
        return;
      }

      // 7. Retry Inference on Error
      const retryBtn = e.target.closest('.btn-retry-inference');
      if (retryBtn) {
        const conv = this.getActiveConversation();
        const lastUser = [...conv.messages].reverse().find(m => m.role === 'user');
        if (lastUser) {
          this.handleSendPrompt(lastUser.content);
        }
        return;
      }

      // 8. Ask Insight Button
      const askInsightBtn = e.target.closest('.btn-ask-insight');
      if (askInsightBtn) {
        const q = askInsightBtn.getAttribute('data-query');
        if (q) {
          if (tabChat) tabChat.click();
          this.handleSendPrompt(q);
        }
        return;
      }

      // 9. Select Conversation in History Drawer
      const historyItem = e.target.closest('.history-item-row');
      if (historyItem && !e.target.closest('.btn-rename-conv') && !e.target.closest('.btn-delete-conv')) {
        const id = historyItem.getAttribute('data-id');
        if (id) {
          this.activeConversationId = id;
          this.saveConversations();
          this.closeHistoryDrawer();
          this.renderActiveView();
        }
        return;
      }

      // 10. Delete Conversation
      const deleteConvBtn = e.target.closest('.btn-delete-conv');
      if (deleteConvBtn) {
        e.stopPropagation();
        const id = deleteConvBtn.getAttribute('data-id');
        this.conversations = this.conversations.filter(c => c.id !== id);
        if (this.activeConversationId === id) {
          this.activeConversationId = this.conversations[0]?.id || null;
        }
        this.saveConversations();
        this.renderHistoryDrawer();
        this.renderActiveView();
        Toast.show('Conversation deleted.');
        return;
      }

      // 11. Rename Conversation
      const renameConvBtn = e.target.closest('.btn-rename-conv');
      if (renameConvBtn) {
        e.stopPropagation();
        const id = renameConvBtn.getAttribute('data-id');
        const conv = this.conversations.find(c => c.id === id);
        if (conv) {
          const newTitle = prompt('Rename conversation:', conv.title);
          if (newTitle && newTitle.trim()) {
            conv.title = newTitle.trim();
            this.saveConversations();
            this.renderHistoryDrawer();
          }
        }
        return;
      }

      // 12. Copy Code Block button
      const copyCodeBtn = e.target.closest('.btn-copy-code');
      if (copyCodeBtn) {
        const encoded = copyCodeBtn.getAttribute('data-code');
        if (encoded) {
          navigator.clipboard.writeText(decodeURIComponent(encoded));
          Toast.show('Code copied to clipboard.');
        }
        return;
      }
    });

    // VisualViewport listener to keep input above mobile keyboard
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        const dock = document.getElementById('aiInputDock');
        if (dock) {
          const keyboardHeight = window.innerHeight - window.visualViewport.height;
          dock.style.transform = keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : 'none';
        }
      });
    }
  }
};
