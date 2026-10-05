// src/utils/markdown.js – Clean Markdown Formatter for AI Chat Replies

export function parseMarkdown(text) {
  if (!text) return '';

  let html = text;

  // Escape HTML tags to prevent XSS
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code Blocks (```lang ... ```) with Copy Button
  html = html.replace(/```([a-z0-9_-]+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'code';
    const trimmed = code.trim();
    const encoded = encodeURIComponent(trimmed);
    return `
      <div class="code-block-container my-3 rounded-lg overflow-hidden border border-obsidian-border bg-obsidian-sidebar">
        <div class="flex items-center justify-between px-3 py-1.5 bg-obsidian-card border-b border-obsidian-border text-[10px] font-mono text-obsidian-textSecondary select-none">
          <span class="uppercase tracking-wider font-semibold text-obsidian-cyan">${language}</span>
          <button class="btn-copy-code hover:text-obsidian-brightCyan flex items-center space-x-1 transition-colors" data-code="${encoded}">
            <i class="ph ph-copy text-xs"></i>
            <span>Copy</span>
          </button>
        </div>
        <pre class="p-3 font-mono text-[11px] overflow-x-auto text-obsidian-textPrimary leading-relaxed"><code>${trimmed}</code></pre>
      </div>
    `;
  });

  // Inline Code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="bg-obsidian-card px-1.5 py-0.5 rounded font-mono text-obsidian-cyan text-[11px] border border-obsidian-border/50">$1</code>');

  // Blockquotes (> text)
  html = html.replace(/^>\s*(.*$)/gim, '<blockquote class="border-l-2 border-obsidian-cyan pl-3 py-1 my-2 text-xs italic text-obsidian-textSecondary bg-obsidian-cyan/5 rounded-r">$1</blockquote>');

  // Bold (**text**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-obsidian-textPrimary">$1</strong>');

  // Italic (*text*)
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-obsidian-textPrimary/90">$1</em>');

  // Headers
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-xs font-semibold text-obsidian-textPrimary mt-3 mb-1 font-mono uppercase tracking-wide text-obsidian-textSecondary">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-obsidian-cyan mt-3 mb-1 font-mono uppercase tracking-wider">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-obsidian-textPrimary mt-3 mb-1 tracking-tight">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-obsidian-textPrimary mt-4 mb-2 tracking-tight">$1</h1>');

  // Tables
  html = html.replace(/^\|(.+)\|$/gim, (match) => {
    if (match.includes('---')) return '<!-- sep -->';
    const cells = match.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    const isFirstRow = false;
    const tds = cells.map(c => `<td class="px-3 py-2 border-b border-obsidian-border/40 text-xs">${c.trim()}</td>`).join('');
    return `<tr>${tds}</tr>`;
  });

  // Clean table rows and wrap
  html = html.replace(/<!-- sep -->\n?/g, '');
  if (html.includes('<tr>')) {
    html = html.replace(/(<tr>[\s\S]*?<\/tr>)+/g, (rows) => {
      return `
        <div class="overflow-x-auto my-3 rounded-lg border border-obsidian-border">
          <table class="w-full text-left font-mono bg-obsidian-card text-xs divide-y divide-obsidian-border">
            ${rows}
          </table>
        </div>
      `;
    });
  }

  // Unordered Bullet Lists (- item or * item)
  html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li class="ml-4 list-disc text-obsidian-textPrimary/90">$1</li>');
  html = html.replace(/(<li class="ml-4 list-disc[^"]*"[\s\S]*?<\/li>)+/g, '<ul class="my-2 space-y-1 text-xs">$&</ul>');

  // Numbered Lists (1. item)
  html = html.replace(/^\s*\d+\.\s+(.*)$/gim, '<li class="ml-4 list-decimal text-obsidian-textPrimary/90">$1</li>');
  html = html.replace(/(<li class="ml-4 list-decimal[^"]*"[\s\S]*?<\/li>)+/g, '<ol class="my-2 space-y-1 text-xs">$&</ol>');

  // Paragraph spacing
  html = html.replace(/\n\n/g, '<div class="h-2"></div>');
  html = html.replace(/\n/g, '<br/>');

  return html;
}
