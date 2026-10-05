// src/components/Toast.js – Notification Toast Component

let toastTimer = null;

export const Toast = {
  render() {
    return `
    <div id="toast" class="fixed top-16 left-4 right-4 sm:left-auto sm:right-auto sm:max-w-[390px] mx-auto transform -translate-y-12 opacity-0 transition-all duration-200 pointer-events-none z-50 bg-obsidian-card/95 backdrop-blur-md border border-obsidian-border px-4 py-2.5 rounded-xl shadow-2xl text-xs font-sans text-obsidian-textPrimary flex items-center space-x-2.5">
      <span class="w-2 h-2 rounded-full bg-obsidian-cyan flex-shrink-0 animate-pulse"></span>
      <span id="toastMsg" class="truncate font-medium">Action executed.</span>
    </div>
    `;
  },

  show(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast || !toastMsg) return;

    toastMsg.innerText = msg;
    toast.classList.remove('-translate-y-12', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('-translate-y-12', 'opacity-0');
    }, 2800);
  }
};
