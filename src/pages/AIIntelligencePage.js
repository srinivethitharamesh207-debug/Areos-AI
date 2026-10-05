// src/pages/AIIntelligencePage.js – Claude Home Screen Style Full-Screen AI Intelligence

import { parseMarkdown } from '../utils/markdown.js';
import { sendMessage } from '../services/chatService.js';
import { Toast } from '../components/Toast.js';

const STORAGE_CONVERSATIONS_KEY = 'areos_ai_conversations_v2';
const STORAGE_ACTIVE_ID_KEY = 'areos_ai_active_conv_id_v2';

export const AIIntelligencePage = {
  currentTab: 'chat', // 'chat' | 'insights'
  conversations: [],
  activeConversationId: null,
  isReplying: false,
  abortController: null,
  attachedFiles: [],
  historyFilter: '',

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
    } catch (e) {
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
    this.saveConversations();
    this.currentTab = 'chat';
    this.renderActiveView();
    Toast.show('Started a new AI conversation.');
  },

  // Time-based greeting helper
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning, Alexander';
    if (hour < 18) return 'Good afternoon, Alexander';
    return 'Good evening, Alexander';
  },

  render() {
    return `
    <div id="aiIntelligenceRoot" class="flex flex-col h-full w-full relative overflow-hidden bg-obsidian-bg">
      
      <!-- SEGMENTED CONTROL: [ Chat | Insights ] -->
      <div class="px-4 py-2 bg-obsidian-bg/80 backdrop-blur-sm border-b border-obsidian-border/40 flex items-center justify-center flex-shrink-0 z-10">
        <div class="inline-flex p-0.5 rounded-xl bg-obsidian-card border border-obsidian-border text-xs font-medium select-none shadow-inner">
          <button id="tabSegmentChat" class="px-4 py-1 rounded-lg ${this.currentTab === 'chat' ? 'bg-obsidian-bg text-obsidian-cyan shadow-sm border border-obsidian-border' : 'text-obsidian-textSecondary hover:text-obsidian-textPrimary'} transition-all">
            Chat
          </button>
          <button id="tabSegmentInsights" class="px-4 py-1 rounded-lg ${this.currentTab === 'insights' ? 'bg-obsidian-bg text-obsidian-cyan shadow-sm border border-obsidian-border' : 'text-obsidian-textSecondary hover:text-obsidian-textPrimary'} transition-all">
            Insights
          </button>
        </div>
      </div>

      <!-- MAIN CONTENT VIEW CONTAINER -->
      <div class="flex-1 relative overflow-hidden flex flex-col min-h-0">
        
        <!-- 1. CHAT CONTAINER VIEW -->
        <div id="viewChatSection" class="${this.currentTab === 'chat' ? 'flex' : 'hidden'} flex-col flex-1 h-full min-h-0 relative">
          
          <!-- SCROLLABLE CHAT CONTENT (WELCOME SCREEN OR CONVERSATION) -->
          <div id="aiScrollArea" class="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
            <!-- Dynamically populated -->
          </div>

          <!-- FLOATING SCROLL TO BOTTOM BUTTON -->
          <button id="btnScrollToBottom" class="hidden absolute right-4 bottom-36 w-9 h-9 rounded-full bg-obsidian-card border border-obsidian-border text-obsidian-cyan shadow-xl flex items-center justify-center hover:bg-obsidian-hover active:scale-95 transition-all z-20" title="Scroll to latest message">
            <i class="ph ph-caret-down text-lg"></i>
          </button>

          <!-- FLOATING CLAUDE-STYLE CHAT INPUT -->
          <div id="aiInputDock" class="flex-shrink-0 p-3 sm:p-4 bg-gradient-to-t from-obsidian-bg via-obsidian-bg/95 to-transparent pb-[max(0.75rem,env(safe-area-inset-bottom))] z-20">
            <div id="aiInputCard" class="w-full bg-obsidian-card border border-obsidian-border rounded-2xl sm:rounded-3xl p-3 shadow-2xl transition-all focus-within:border-obsidian-cyan focus-within:ring-1 focus-within:ring-obsidian-cyan/30">
              
              <!-- Attached Files Chips Row -->
              <div id="attachedFilesContainer" class="hidden flex-wrap gap-1.5 pb-2 border-b border-obsidian-border/40 mb-2"></div>

              <!-- Textarea Auto-Growing -->
              <textarea
                id="aiPromptInput"
                rows="1"
                placeholder="Ask Areos AI anything..."
                class="w-full bg-transparent text-xs sm:text-sm text-obsidian-textPrimary placeholder-obsidian-textSecondary focus:outline-none resize-none font-sans leading-relaxed max-h-36"
              ></textarea>

              <!-- Controls Bottom Row inside same card -->
              <div class="flex items-center justify-between mt-2 pt-1">
                <!-- Left: Plus Attachment Button -->
                <div class="relative">
                  <button id="btnAttachMenu" type="button" class="w-8 h-8 rounded-full flex items-center justify-center text-obsidian-textSecondary hover:text-obsidian-textPrimary hover:bg-obsidian-bg active:scale-95 transition-all" title="Attach file or context">
                    <i class="ph ph-plus text-lg"></i>
                  </button>

                  <!-- Attach Popup Sheet -->
                  <div id="attachPopup" class="hidden absolute bottom-10 left-0 bg-obsidian-sidebar border border-obsidian-border rounded-xl p-2 shadow-2xl space-y-1 w-48 text-xs font-sans z-30">
                    <button class="attach-opt-btn w-full px-2.5 py-1.5 rounded-lg hover:bg-obsidian-card text-left flex items-center space-x-2 text-obsidian-textPrimary" data-type="Portfolio Snapshot">
                      <i class="ph ph-chart-pie-slice text-obsidian-cyan text-base"></i>
                      <span>Portfolio Snapshot</span>
                    </button>
                    <button class="attach-opt-btn w-full px-2.5 py-1.5 rounded-lg hover:bg-obsidian-card text-left flex items-center space-x-2 text-obsidian-textPrimary" data-type="Market Chart">
                      <i class="ph ph-image text-obsidian-aiPurple text-base"></i>
                      <span>Photo / Chart</span>
                    </button>
                    <button class="attach-opt-btn w-full px-2.5 py-1.5 rounded-lg hover:bg-obsidian-card text-left flex items-center space-x-2 text-obsidian-textPrimary" data-type="Financial File">
                      <i class="ph ph-file-text text-obsidian-textSecondary text-base"></i>
                      <span>File / Report</span>
                    </button>
                    <button class="attach-opt-btn w-full px-2.5 py-1.5 rounded-lg hover:bg-obsidian-card text-left flex items-center space-x-2 text-obsidian-textPrimary" data-type="Camera Scan">
                      <i class="ph ph-camera text-obsidian-textSecondary text-base"></i>
                      <span>Camera</span>
                    </button>
                  </div>
                </div>

                <!-- Right: Action Button (Microphone -> ArrowUp -> Stop) -->
                <div class="flex items-center space-x-2">
                  <button
                    id="btnChatAction"
                    type="button"
                    class="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95"
                    title="Voice input"
                  >
                    <i id="chatActionIcon" class="ph ph-microphone text-lg text-obsidian-textSecondary hover:text-obsidian-cyan"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Disclaimer Under Input -->
            <div class="text-center text-[10px] text-obsidian-textSecondary/70 mt-1.5 select-none font-sans">
              Areos AI can make mistakes. Verify important financial information.
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
            <h3 class="text-sm font-semibold text-obsidian-textPrimary font-sans">12 Venture Deals Matched</h3>
            <p class="text-xs text-obsidian-textSecondary leading-relaxed">
              12 quantum hardware, post-quantum encryption and synthetic biology startups match your institutional growth parameters with a mean projected Sharpe of 2.65.
            </p>
            <div class="pt-2 border-t border-obsidian-border/50 flex items-center justify-between">
              <span class="text-[10px] font-mono text-obsidian-textSecondary">Screened in 0.4s • High Precision</span>
              <button class="btn-ask-insight px-2.5 py-1 rounded bg-obsidian-bg border border-obsidian-border hover:border-obsidian-cyan text-obsidian-cyan text-[11px] font-medium flex items-center space-x-1" data-query="Give me a deep dive on the 12 matched venture deals">
                <span>Ask AI</span>
                <i class="ph ph-arrow-up-right text-xs"></i>
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- 3. SLIDE-IN HISTORY DRAWER -->
      <div id="aiHistoryDrawerBackdrop" class="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 hidden transition-opacity duration-200 opacity-0 flex">
        <div id="aiHistoryDrawerPanel" class="w-4/5 max-w-[320px] h-full bg-obsidian-sidebar border-r border-obsidian-border flex flex-col transform -translate-x-full transition-transform duration-200 ease-out shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          
          <!-- History Header -->
          <div class="h-14 px-4 border-b border-obsidian-border flex items-center justify-between flex-shrink-0">
            <div class="flex items-center space-x-2">
              <i class="ph ph-clock-counter-clockwise text-lg text-obsidian-aiPurple"></i>
              <span class="text-sm font-bold text-obsidian-textPrimary font-sans">Chat History</span>
            </div>
            <button id="btnCloseHistoryDrawer" class="w-8 h-8 rounded-lg flex items-center justify-center text-obsidian-textSecondary hover:text-obsidian-textPrimary">
              <i class="ph ph-x text-lg"></i>
            </button>
          </div>

          <!-- New Chat Action Button in Drawer -->
          <div class="p-3 border-b border-obsidian-border/60">
            <button id="btnDrawerNewChat" class="w-full min-h-[44px] rounded-xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan/50 text-obsidian-textPrimary hover:text-obsidian-cyan text-xs font-semibold flex items-center justify-center space-x-2 active:scale-95 transition-all">
              <i class="ph ph-note-pencil text-base text-obsidian-cyan"></i>
              <span>New Conversation</span>
            </button>
          </div>

          <!-- Search History Input -->
          <div class="px-3 py-2 border-b border-obsidian-border/40">
            <div class="relative flex items-center">
              <i class="ph ph-magnifying-glass text-xs text-obsidian-textSecondary absolute left-2.5 pointer-events-none"></i>
              <input
                type="text"
                id="historySearchInput"
                placeholder="Search history..."
                class="w-full h-8 bg-obsidian-card border border-obsidian-border rounded-lg pl-7 pr-3 text-[11px] text-obsidian-textPrimary placeholder-obsidian-textSecondary focus:border-obsidian-cyan focus:outline-none font-sans"
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
              </div>
              <div class="text-[9px] font-mono text-obsidian-textSecondary mt-1 text-right">${timeStr}</div>
            </div>
          </div>
          `;
        } else if (m.role === 'assistant') {
          const parsed = parseMarkdown(m.content);
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

              <!-- Message Actions Row: Copy, ThumbsUp, ThumbsDown, ArrowsClockwise -->
              <div class="flex items-center space-x-3 mt-2 text-obsidian-textSecondary text-xs">
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

              <!-- 2-3 Follow-up Suggestion Chips after Latest Reply -->
              ${isLatest && !this.isReplying ? `
                <div class="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-obsidian-border/30">
                  <button class="ai-followup-chip px-2.5 py-1 rounded-full bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan text-[11px] font-sans text-obsidian-textSecondary hover:text-obsidian-cyan active:scale-95 transition-all" data-prompt="Run a 10% market stress test">
                    Run a 10% market stress test
                  </button>
                  <button class="ai-followup-chip px-2.5 py-1 rounded-full bg-obsidian-card border border-obsidian-border hover:border-obsidian-cyan text-[11px] font-sans text-obsidian-textSecondary hover:text-obsidian-cyan active:scale-95 transition-all" data-prompt="What hedging strategies apply here?">
                    What hedging strategies apply?
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
          `;
        } else if (m.role === 'error') {
          html += `
          <div class="flex items-start space-x-2.5 mb-4 animate-fadeIn">
            <div class="w-6 h-6 rounded-md bg-obsidian-negative/15 border border-obsidian-negative/30 flex items-center justify-center text-obsidian-negative flex-shrink-0 mt-0.5">
              <i class="ph ph-warning-circle text-xs"></i>
            </div>
            <div class="flex-1 bg-obsidian-card border border-obsidian-negative/40 rounded-xl p-3 text-xs">
              <div class="text-obsidian-negative font-semibold font-sans mb-1">Inference Notice</div>
              <div class="text-obsidian-textSecondary">${m.content}</div>
              <button class="btn-retry-inference mt-2.5 px-3 py-1 rounded-lg bg-obsidian-negative/20 border border-obsidian-negative/40 text-obsidian-negative hover:bg-obsidian-negative/30 text-[11px] font-mono font-semibold flex items-center space-x-1 active:scale-95 transition-all" data-msg-idx="${idx}">
                <i class="ph ph-arrows-clockwise text-xs"></i>
                <span>Retry</span>
              </button>
            </div>
          </div>
          `;
        }
      });

      // Typing / Thinking Indicator
      if (this.isReplying) {
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
      btn.className = 'w-8 h-8 rounded-full bg-obsidian-negative text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all';
      icon.className = 'ph-fill ph-stop text-sm';
      btn.title = 'Stop generating';
    } else {
      const hasText = input && input.value.trim().length > 0;
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

  // Send a prompt
  async handleSendPrompt(text) {
    if (!text || this.isReplying) return;

    const conv = this.getActiveConversation();

    // If first message in conversation, set meaningful title
    if (!conv.messages || conv.messages.length === 0) {
      conv.title = text.length > 28 ? text.slice(0, 28) + '...' : text;
    }

    // Attach any attached files into prompt context
    let finalPrompt = text;
    if (this.attachedFiles.length > 0) {
      finalPrompt = `[Attached Context: ${this.attachedFiles.join(', ')}]\n\n${text}`;
      this.attachedFiles = [];
      this.renderAttachedChips();
    }

    conv.messages.push({
      role: 'user',
      content: finalPrompt,
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
    this.abortController = new AbortController();
    this.renderActiveView();

    // Create placeholder AI message for streaming
    const aiMsg = {
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };
    conv.messages.push(aiMsg);
    const aiMsgIdx = conv.messages.length - 1;

    try {
      await sendMessage(
        conv.messages.filter(m => m.role === 'user' || m.role === 'assistant'),
        {
          portfolioValue: '$48,281.42',
          sentiment: 'Bullish (78/100)',
          riskScore: 'Moderate (42/100)',
          holdings: 'NVDA, AAPL, VOO, BTC'
        },
        (chunkText) => {
          conv.messages[aiMsgIdx].content = chunkText;
          this.renderActiveView();
        },
        this.abortController.signal
      );
    } catch (err) {
      if (err.name === 'AbortError') {
        Toast.show('Inference stopped by user.');
        if (!conv.messages[aiMsgIdx].content) {
          conv.messages.splice(aiMsgIdx, 1);
        }
      } else {
        conv.messages[aiMsgIdx] = {
          role: 'error',
          content: err.message || 'Connection error while communicating with AI Engine.',
          timestamp: Date.now()
        };
      }
    } finally {
      this.isReplying = false;
      this.abortController = null;
      conv.updatedAt = Date.now();
      this.saveConversations();
      this.renderActiveView();
    }
  },

  renderAttachedChips() {
    const container = document.getElementById('attachedFilesContainer');
    if (!container) return;

    if (this.attachedFiles.length === 0) {
      container.classList.add('hidden');
      container.innerHTML = '';
      return;
    }

    container.classList.remove('hidden');
    container.innerHTML = this.attachedFiles.map((file, idx) => `
      <span class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-obsidian-bg border border-obsidian-cyan/30 text-[10px] font-mono text-obsidian-cyan">
        <i class="ph ph-file-text text-xs"></i>
        <span>${file}</span>
        <button class="btn-remove-attach text-obsidian-textSecondary hover:text-obsidian-negative ml-0.5" data-idx="${idx}">
          <i class="ph ph-x text-xs"></i>
        </button>
      </span>
    `).join('');
  },

  // Render History Drawer List with Groups: Today / Yesterday / Previous 7 days / Older
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
      html = `<div class="py-8 text-center text-xs font-mono text-obsidian-textSecondary">No conversations yet</div>`;
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
        tabChat.className = 'px-4 py-1 rounded-lg bg-obsidian-bg text-obsidian-cyan shadow-sm border border-obsidian-border transition-all';
        tabInsights.className = 'px-4 py-1 rounded-lg text-obsidian-textSecondary hover:text-obsidian-textPrimary transition-all';
        viewChat?.classList.remove('hidden');
        viewChat?.classList.add('flex');
        viewInsights?.classList.add('hidden');
        viewInsights?.classList.remove('flex');
        this.scrollToBottom();
      });

      tabInsights.addEventListener('click', () => {
        this.currentTab = 'insights';
        tabInsights.className = 'px-4 py-1 rounded-lg bg-obsidian-bg text-obsidian-cyan shadow-sm border border-obsidian-border transition-all';
        tabChat.className = 'px-4 py-1 rounded-lg text-obsidian-textSecondary hover:text-obsidian-textPrimary transition-all';
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
          if (isMobile) {
            // Mobile: Enter = new line
            return;
          }
          if (!e.shiftKey) {
            // Desktop: Enter = send
            e.preventDefault();
            const text = input.value.trim();
            if (text) {
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
        } else {
          const text = input ? input.value.trim() : '';
          if (text) {
            this.handleSendPrompt(text);
          } else {
            Toast.show('Voice input: Listening... (Simulated microphone)');
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
          if (type) {
            this.attachedFiles.push(type);
            this.renderAttachedChips();
            attachPopup.classList.add('hidden');
            Toast.show(`Attached: ${type}`);
            if (input) input.focus();
          }
        });
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
          navigator.clipboard.writeText(conv.messages[idx].content);
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

      // 7. Retry Inference
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
