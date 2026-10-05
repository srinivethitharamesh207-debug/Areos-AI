// server/marketData.js - Real-Time Market Data Provider with Caching and Fallbacks
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

// In-memory cache with TTL
const cache = new Map();
const TTL = {
  QUOTES: 45 * 1000,      // 45 seconds for quotes
  HISTORY: 15 * 60 * 1000, // 15 minutes for history
  NEWS: 10 * 60 * 1000,    // 10 minutes for news
  STATUS: 60 * 1000       // 1 minute for market status
};

// Clean ticker mapping
export const TICKER_MAP = {
  'sp500': '^GSPC',
  's&p 500': '^GSPC',
  's&p500': '^GSPC',
  '^gspc': '^GSPC',
  'nifty': '^NSEI',
  'nifty 50': '^NSEI',
  'nifty50': '^NSEI',
  '^nsei': '^NSEI',
  'nasdaq': '^IXIC',
  '^ixic': '^IXIC',
  'btc': 'BTC-USD',
  'bitcoin': 'BTC-USD',
  'btc-usd': 'BTC-USD',
  'eth': 'ETH-USD',
  'ethereum': 'ETH-USD',
  'sol': 'SOL-USD',
  'solana': 'SOL-USD',
  'apple': 'AAPL',
  'nvidia': 'NVDA',
  'microsoft': 'MSFT',
  'amazon': 'AMZN',
  'tesla': 'TSLA',
  'vanguard': 'VOO'
};

export function normalizeSymbol(sym) {
  if (!sym) return 'NVDA';
  const clean = sym.trim().toUpperCase().replace(/^\$/, '');
  const lower = sym.trim().toLowerCase().replace(/^\$/, '');
  return TICKER_MAP[lower] || clean;
}

// Request de-duplication map for ongoing fetches
const pendingFetches = new Map();

function getCached(key, ttl) {
  const item = cache.get(key);
  if (!item) return null;
  const isExpired = Date.now() - item.timestamp > ttl;
  return { data: item.data, stale: isExpired, asOf: new Date(item.timestamp).toISOString() };
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch real-time quotes for one or multiple symbols
 */
export async function getQuotes(symbols = ['NVDA', 'AAPL', 'VOO', 'BTC-USD', '^GSPC', '^NSEI']) {
  const symArray = Array.isArray(symbols) ? symbols.map(normalizeSymbol) : [normalizeSymbol(symbols)];
  const cacheKey = `quotes:${symArray.sort().join(',')}`;
  
  const cached = getCached(cacheKey, TTL.QUOTES);
  if (cached && !cached.stale) {
    return { ...cached.data, source: 'cache', stale: false, asOf: cached.asOf };
  }

  // De-duplicate in-flight promises
  if (pendingFetches.has(cacheKey)) {
    return pendingFetches.get(cacheKey);
  }

  const fetchPromise = (async () => {
    try {
      const results = {};
      
      // Fetch concurrently via yahooFinance.quoteCombine or quote
      const fetchList = symArray.map(async (symbol) => {
        try {
          const q = await yahooFinance.quote(symbol);
          if (q) {
            const price = q.regularMarketPrice ?? q.currentPrice ?? q.postMarketPrice ?? 0;
            const prevClose = q.regularMarketPreviousClose ?? price;
            const change = q.regularMarketChange ?? (price - prevClose);
            const changePercent = q.regularMarketChangePercent ?? (prevClose ? (change / prevClose) * 100 : 0);

            results[symbol] = {
              symbol,
              name: q.shortName || q.longName || symbol,
              price: Number(price.toFixed(2)),
              change: Number(change.toFixed(2)),
              changePercent: Number(changePercent.toFixed(2)),
              changeStr: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
              dayHigh: q.regularMarketDayHigh ? Number(q.regularMarketDayHigh.toFixed(2)) : price,
              dayLow: q.regularMarketDayLow ? Number(q.regularMarketDayLow.toFixed(2)) : price,
              volume: q.regularMarketVolume || 0,
              currency: q.currency || 'USD',
              marketCap: q.marketCap || null,
              fiftyTwoWeekHigh: q.fiftyTwoWeekHigh || null,
              fiftyTwoWeekLow: q.fiftyTwoWeekLow || null,
              asOf: new Date().toISOString(),
              source: 'yahoo-finance',
              stale: false
            };
          }
        } catch (itemErr) {
          console.warn(`[getQuotes] Failed to fetch quote for ${symbol}:`, itemErr.message);
          // Check if stale item is in individual cache
          const indCache = getCached(`quote:${symbol}`, TTL.QUOTES);
          if (indCache) {
            results[symbol] = { ...indCache.data, stale: true, asOf: indCache.asOf };
          }
        }
      });

      await Promise.all(fetchList);

      const payload = {
        quotes: results,
        asOf: new Date().toISOString(),
        source: 'yahoo-finance',
        stale: Object.values(results).some(r => r.stale)
      };

      setCache(cacheKey, payload);
      return payload;
    } catch (err) {
      console.error('[getQuotes] Batch quote fetch failed:', err.message);
      if (cached) {
        return { ...cached.data, stale: true, source: 'cache-fallback', asOf: cached.asOf };
      }
      throw new Error(`Real-time quotes unavailable: ${err.message}`);
    } finally {
      pendingFetches.delete(cacheKey);
    }
  })();

  pendingFetches.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Fetch historical candles for an asset
 * @param {string} symbol
 * @param {number} days
 * @param {string} interval - '1d' | '1wk' | '1h'
 */
export async function getHistory(symbol = 'NVDA', days = 365, interval = '1d') {
  const norm = normalizeSymbol(symbol);
  const cacheKey = `history:${norm}:${days}:${interval}`;

  const cached = getCached(cacheKey, TTL.HISTORY);
  if (cached && !cached.stale) {
    return { ...cached.data, source: 'cache', stale: false, asOf: cached.asOf };
  }

  try {
    const period2 = new Date();
    const period1 = new Date();
    period1.setDate(period2.getDate() - days);

    const queryOptions = {
      period1,
      period2,
      interval
    };

    const chartRes = await yahooFinance.chart(norm, queryOptions);
    const rawQuotes = chartRes?.quotes || [];

    if (!rawQuotes || rawQuotes.length === 0) {
      throw new Error(`No historical data returned for ${norm}`);
    }

    const candles = rawQuotes.map(bar => ({
      date: bar.date instanceof Date ? bar.date.toISOString().split('T')[0] : String(bar.date || '').split('T')[0],
      open: Number(bar.open?.toFixed(2) || 0),
      high: Number(bar.high?.toFixed(2) || 0),
      low: Number(bar.low?.toFixed(2) || 0),
      close: Number(bar.close?.toFixed(2) || 0),
      volume: bar.volume || 0
    })).filter(c => c.close > 0);

    const payload = {
      symbol: norm,
      interval,
      days,
      candleCount: candles.length,
      candles,
      asOf: new Date().toISOString(),
      source: 'yahoo-finance',
      stale: false
    };

    setCache(cacheKey, payload);
    return payload;
  } catch (err) {
    console.error(`[getHistory] Error fetching history for ${norm}:`, err.message);
    if (cached) {
      return { ...cached.data, stale: true, source: 'cache-fallback', asOf: cached.asOf };
    }
    throw new Error(`Historical data for ${norm} unavailable: ${err.message}`);
  }
}

/**
 * Fetch live financial news headlines for a symbol or the general market
 */
export async function getNews(symbol = 'market') {
  const norm = symbol.toLowerCase() === 'market' ? 'market' : normalizeSymbol(symbol);
  const cacheKey = `news:${norm}`;

  const cached = getCached(cacheKey, TTL.NEWS);
  if (cached && !cached.stale) {
    return { ...cached.data, source: 'cache', stale: false, asOf: cached.asOf };
  }

  try {
    const finnhubKey = process.env.FINNHUB_API_KEY;
    let articles = [];

    // Try Finnhub if key is present
    if (finnhubKey && finnhubKey !== 'your_finnhub_key_here') {
      try {
        const today = new Date().toISOString().split('T')[0];
        const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const finnhubUrl = norm === 'market'
          ? `https://finnhub.io/api/v1/news?category=general&token=${finnhubKey}`
          : `https://finnhub.io/api/v1/company-news?symbol=${norm}&from=${lastWeek}&to=${today}&token=${finnhubKey}`;

        const res = await fetch(finnhubUrl);
        if (res.ok) {
          const list = await res.json();
          articles = (list || []).slice(0, 10).map(item => ({
            headline: item.headline,
            summary: item.summary,
            url: item.url,
            source: item.source,
            datetime: item.datetime ? new Date(item.datetime * 1000).toISOString() : new Date().toISOString()
          }));
        }
      } catch (fhErr) {
        console.warn('[getNews] Finnhub error, falling back to Yahoo search news:', fhErr.message);
      }
    }

    // Fallback: Yahoo Finance search / news
    if (articles.length === 0) {
      const query = norm === 'market' ? 'stock market macro' : norm;
      const searchRes = await yahooFinance.search(query, { newsCount: 8 });
      if (searchRes && searchRes.news) {
        articles = searchRes.news.map(n => ({
          headline: n.title,
          summary: n.publisher ? `Reported by ${n.publisher}` : '',
          url: n.link,
          source: n.publisher || 'Yahoo Finance',
          datetime: n.providerPublishTime ? new Date(n.providerPublishTime).toISOString() : new Date().toISOString()
        }));
      }
    }

    const payload = {
      symbol: norm,
      articles,
      count: articles.length,
      asOf: new Date().toISOString(),
      source: articles.length > 0 ? (finnhubKey ? 'finnhub/yahoo' : 'yahoo-finance') : 'live-news',
      stale: false
    };

    setCache(cacheKey, payload);
    return payload;
  } catch (err) {
    console.error(`[getNews] Error fetching news for ${norm}:`, err.message);
    if (cached) {
      return { ...cached.data, stale: true, source: 'cache-fallback', asOf: cached.asOf };
    }
    return { symbol: norm, articles: [], count: 0, asOf: new Date().toISOString(), stale: true, error: err.message };
  }
}

/**
 * Check if major exchanges (NYSE, NSE) are currently open
 */
export function getMarketStatus() {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHours = now.getUTCHours();
  const utcMins = now.getUTCMinutes();
  const utcTimeMin = utcHours * 60 + utcMins;

  // NYSE: 9:30 AM - 4:00 PM EST (13:30 - 20:00 UTC) Mon-Fri
  const isWeekday = utcDay >= 1 && utcDay <= 5;
  const nyseOpen = isWeekday && utcTimeMin >= (13 * 60 + 30) && utcTimeMin < (20 * 60);

  // NSE (India): 9:15 AM - 3:30 PM IST (03:45 - 10:00 UTC) Mon-Fri
  const nseOpen = isWeekday && utcTimeMin >= (3 * 60 + 45) && utcTimeMin < (10 * 60);

  // Crypto: 24/7/365
  return {
    nyse: {
      name: 'New York Stock Exchange',
      isOpen: nyseOpen,
      session: nyseOpen ? 'Regular Trading' : 'Closed',
      hours: '09:30 - 16:00 EST'
    },
    nse: {
      name: 'National Stock Exchange of India',
      isOpen: nseOpen,
      session: nseOpen ? 'Regular Trading' : 'Closed',
      hours: '09:15 - 15:30 IST'
    },
    crypto: {
      name: 'Global Crypto Markets',
      isOpen: true,
      session: 'Active (24/7)',
      hours: 'Continuous'
    },
    asOf: now.toISOString()
  };
}

/**
 * Calculates live portfolio valuation based on current live quotes
 */
export async function getLivePortfolioState() {
  const defaultHoldings = [
    { symbol: 'NVDA', name: 'NVIDIA Corp', shares: 120.0, avgCost: 112.50, sector: 'Technology' },
    { symbol: 'AAPL', name: 'Apple Inc', shares: 42.0, avgCost: 210.00, sector: 'Technology' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', shares: 20.0, avgCost: 490.20, sector: 'Broad Market ETF' },
    { symbol: 'BTC-USD', name: 'Bitcoin (Vault)', shares: 0.084, avgCost: 62400.00, sector: 'Digital Assets' }
  ];
  const cashReserves = 3862.00;

  const quoteSymbols = defaultHoldings.map(h => h.symbol);
  const { quotes, stale, asOf } = await getQuotes(quoteSymbols);

  let totalEquityValue = 0;
  let totalCostBasis = 0;

  const evaluatedHoldings = defaultHoldings.map(h => {
    const q = quotes[h.symbol] || {};
    const currentPrice = q.price || h.avgCost;
    const value = currentPrice * h.shares;
    const cost = h.avgCost * h.shares;
    const pnl = value - cost;
    const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

    totalEquityValue += value;
    totalCostBasis += cost;

    return {
      symbol: h.symbol,
      name: h.name,
      sector: h.sector,
      shares: h.shares,
      avgCost: h.avgCost,
      currentPrice,
      value: Number(value.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
      changeToday: q.changeStr || '0.00%',
      weight: 0 // Will compute below
    };
  });

  const totalPortfolioValue = totalEquityValue + cashReserves;
  totalCostBasis += cashReserves;

  // Add weights
  evaluatedHoldings.forEach(h => {
    h.weightPercent = totalPortfolioValue > 0 ? Number(((h.value / totalPortfolioValue) * 100).toFixed(1)) : 0;
    h.weight = `${h.weightPercent}%`;
  });

  const unrealizedPnL = totalPortfolioValue - totalCostBasis;
  const unrealizedPnLPercent = totalCostBasis > 0 ? (unrealizedPnL / totalCostBasis) * 100 : 0;

  return {
    totalValue: Number(totalPortfolioValue.toFixed(2)),
    totalCostBasis: Number(totalCostBasis.toFixed(2)),
    unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
    unrealizedPnLPercent: Number(unrealizedPnLPercent.toFixed(2)),
    cashReserves,
    holdings: evaluatedHoldings,
    asOf,
    source: 'live-quotes',
    stale
  };
}
