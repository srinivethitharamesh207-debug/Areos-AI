// server/nlp/regex.js - Rule-based & Regex Entity Extractor for Market & Financial Queries

const COMPANY_TICKER_MAP = {
  'nvidia': 'NVDA',
  'apple': 'AAPL',
  'microsoft': 'MSFT',
  'amazon': 'AMZN',
  'tesla': 'TSLA',
  'vanguard': 'VOO',
  'bitcoin': 'BTC-USD',
  'btc': 'BTC-USD',
  'ethereum': 'ETH-USD',
  'eth': 'ETH-USD',
  'solana': 'SOL-USD',
  'sol': 'SOL-USD',
  's&p 500': '^GSPC',
  's&p500': '^GSPC',
  'sp500': '^GSPC',
  'spx': '^GSPC',
  'nifty 50': '^NSEI',
  'nifty50': '^NSEI',
  'nifty': '^NSEI',
  'nasdaq': '^IXIC',
  'meta': 'META',
  'alphabet': 'GOOGL',
  'google': 'GOOGL'
};

const KNOWN_TICKERS = new Set([
  'NVDA', 'AAPL', 'MSFT', 'AMZN', 'TSLA', 'VOO', 'SPY', 'QQQ',
  'BTC', 'ETH', 'SOL', 'BTC-USD', 'ETH-USD', 'SOL-USD',
  '^GSPC', '^NSEI', '^IXIC', 'GOOGL', 'META', 'AMD', 'INTC'
]);

/**
 * Extracts financial entities, parameters, and slash commands from user input text
 * @param {string} text
 * @returns {Object} Extracted entities
 */
export function extractEntities(text = '') {
  const raw = text.trim();
  const lower = raw.toLowerCase();

  // 1. Slash commands: e.g. /forecast NVDA 30d, /optimize, /risk, /sentiment AAPL
  let command = null;
  const commandMatch = raw.match(/^\/([a-zA-Z_-]+)(?:\s+(.*))?$/);
  if (commandMatch) {
    command = {
      tool: commandMatch[1].toLowerCase(),
      args: (commandMatch[2] || '').trim()
    };
  }

  // 2. Tickers & Company Names
  const tickers = new Set();

  // $TICKER pattern: $NVDA, $BTC
  const cashTickerMatches = raw.matchAll(/\$([A-Za-z0-9^.-]{2,10})\b/g);
  for (const m of cashTickerMatches) {
    const sym = m[1].toUpperCase();
    if (sym !== 'USD') {
      tickers.add(sym === 'BTC' ? 'BTC-USD' : sym);
    }
  }

  // Known tickers as standalone words: NVDA, AAPL, BTC, S&P 500, etc.
  for (const [name, sym] of Object.entries(COMPANY_TICKER_MAP)) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lower)) {
      tickers.add(sym);
    }
  }

  // Uppercase standalone word tickers (e.g. "NVDA", "AAPL")
  const wordTokens = raw.split(/[\s,;.?!()]+/);
  for (const token of wordTokens) {
    const clean = token.toUpperCase();
    if (KNOWN_TICKERS.has(clean)) {
      tickers.add(clean === 'BTC' ? 'BTC-USD' : (clean === 'ETH' ? 'ETH-USD' : clean));
    }
  }

  // 3. Amounts (e.g. "$5,000", "$2500", "5000 dollars")
  const amounts = [];
  const amountMatches = raw.matchAll(/\$\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s?(?:k|m|b)?/gi);
  for (const m of amountMatches) {
    amounts.push(m[0]);
  }

  // 4. Percentages & Drops (e.g. "10% drop", "15% market crash", "20%")
  const percentages = [];
  let dropPercent = null;
  const pctMatches = raw.matchAll(/([+-]?[0-9]+(?:\.[0-9]+)?)\s?%/g);
  for (const m of pctMatches) {
    const val = parseFloat(m[1]);
    percentages.push(val);
    if (lower.includes('drop') || lower.includes('crash') || lower.includes('shock') || lower.includes('stress') || lower.includes('down')) {
      dropPercent = Math.abs(val);
    }
  }

  // 5. Timeframes (e.g. "next week", "14 days", "30 days", "1Y", "YTD", "6 months")
  let timeframe = null;
  let horizonDays = null;

  const dayMatch = raw.match(/([0-9]+)\s?(?:days|d\b)/i);
  if (dayMatch) {
    horizonDays = parseInt(dayMatch[1], 10);
    timeframe = `${horizonDays} days`;
  } else if (/next\s+week/i.test(lower) || /7\s?d/i.test(lower)) {
    horizonDays = 7;
    timeframe = '7 days';
  } else if (/next\s+month/i.test(lower) || /30\s?d/i.test(lower)) {
    horizonDays = 30;
    timeframe = '30 days';
  } else if (/ytd/i.test(lower)) {
    timeframe = 'YTD';
  } else if (/1\s?y(?:ear)?/i.test(lower)) {
    timeframe = '1 year';
    horizonDays = 365;
  }

  // 6. Risk Level
  let riskLevel = null;
  if (/low[\s-]risk/i.test(lower)) riskLevel = 'low';
  else if (/moderate[\s-]risk/i.test(lower) || /medium[\s-]risk/i.test(lower)) riskLevel = 'moderate';
  else if (/high[\s-]risk/i.test(lower) || /aggressive/i.test(lower)) riskLevel = 'high';

  // 7. Comparison Phrases
  const isComparison = /\b(vs|versus|compare|comparison|between)\b/i.test(lower);

  // 8. Sector constraints (e.g. "tech under 30%", "technology <= 30%")
  let sectorConstraint = null;
  const sectorMatch = raw.match(/(?:tech|technology|crypto|equities)\s*(?:under|less than|<=|below|<)\s*([0-9]+)%/i);
  if (sectorMatch) {
    sectorConstraint = {
      sector: 'Technology',
      maxWeightPercent: parseInt(sectorMatch[1], 10)
    };
  }

  return {
    raw,
    command,
    tickers: Array.from(tickers),
    amounts,
    percentages,
    dropPercent,
    timeframe,
    horizonDays: horizonDays || 14,
    riskLevel,
    isComparison,
    sectorConstraint
  };
}
