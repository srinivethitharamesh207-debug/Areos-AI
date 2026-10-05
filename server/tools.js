// server/tools.js - Real-Time Analytics & ML Agent Tools
import * as marketData from './marketData.js';
import * as mlClient from './mlClient.js';

export const TOOL_DECLARATIONS = [
  {
    name: 'get_live_quotes',
    description: 'Fetch real-time stock, ETF, index, or crypto quotes with live prices, intraday changes, highs, lows, and volume from Yahoo Finance.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbols: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'List of ticker symbols (e.g. ["NVDA", "BTC-USD", "^GSPC", "AAPL"]).'
        }
      },
      required: ['symbols']
    }
  },
  {
    name: 'get_history',
    description: 'Fetch historical daily or hourly candlestick prices for a security over a specified lookback period.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Ticker symbol (e.g. "NVDA", "AAPL", "BTC-USD").' },
        days: { type: 'NUMBER', description: 'Number of past days (e.g. 30, 90, 365).' },
        interval: { type: 'STRING', description: 'Candle interval: "1d", "1wk", "1h".' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'get_news_sentiment',
    description: 'Fetch latest financial news headlines and calculate NLP financial sentiment scores (-1 to 1 and 0-100 scale).',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Ticker symbol or "market" for macro news.' }
      }
    }
  },
  {
    name: 'compute_risk_metrics',
    description: 'Calculate quantitative risk analytics: Annualized Volatility, Beta vs S&P 500, Sharpe Ratio, Max Drawdown, VaR 95%, CVaR 95%, and composite Risk Score.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Asset symbol or "portfolio" to analyze the user active portfolio.' }
      }
    }
  },
  {
    name: 'detect_regime',
    description: 'Detect current market regime (calm accumulation, trending expansion, or volatile distribution) using KMeans clustering on rolling volatility.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Benchmark symbol to evaluate (e.g. "^GSPC", "^NSEI", "NVDA").' }
      }
    }
  },
  {
    name: 'detect_anomalies',
    description: 'Run IsolationForest anomaly detection on recent returns and volume to flag unusual market spikes or outlier drawdowns.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Ticker symbol (e.g. "NVDA", "BTC-USD").' }
      }
    }
  },
  {
    name: 'forecast_price',
    description: 'Train an on-demand LSTM Neural Network model on historical daily closes to forecast prices 7-30 days ahead, with 80%/95% confidence bands and backtest MAE vs naive baseline.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Ticker symbol to forecast (e.g. "NVDA", "AAPL", "BTC-USD").' },
        horizon: { type: 'NUMBER', description: 'Forecast horizon in days (7 to 30, default 14).' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'monte_carlo',
    description: 'Run 1,000-path Geometric Brownian Motion (GBM) Monte Carlo price simulations and generate quantile confidence boundaries.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'Ticker symbol.' },
        horizon: { type: 'NUMBER', description: 'Number of simulation days.' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'optimize_portfolio',
    description: 'Run Mean-Variance SLSQP Portfolio Optimization to maximize Sharpe ratio under sector constraints (e.g. Technology <= 30%) and generate exact rebalance buy/sell trades.',
    parameters: {
      type: 'OBJECT',
      properties: {
        max_tech_weight: { type: 'NUMBER', description: 'Maximum tech sector allocation (e.g. 0.30 for 30%).' }
      }
    }
  },
  {
    name: 'run_stress_test',
    description: 'Simulate macroeconomic shock drawdown (-10%, -15%, -20%) or scenario crisis (rate hike, tech selloff, crypto crash) across portfolio holdings.',
    parameters: {
      type: 'OBJECT',
      properties: {
        drop_percent: { type: 'NUMBER', description: 'Market drop percentage (e.g. 15 for 15%).' },
        scenario: { type: 'STRING', description: 'Scenario type: "custom", "rate_hike", "tech_selloff", "crypto_crash".' }
      }
    }
  },
  {
    name: 'compare_assets',
    description: 'Compare live market metrics, returns, and valuation between two or more assets (e.g. S&P 500 vs NIFTY 50, NVDA vs AAPL).',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbols: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Assets to compare (e.g. ["^GSPC", "^NSEI"]).' }
      },
      required: ['symbols']
    }
  },
  {
    name: 'scan_startups',
    description: 'Screen venture capital deals and startup opportunities ranked by quantitative growth, TAM, and risk scores.',
    parameters: {
      type: 'OBJECT',
      properties: {
        criteria: { type: 'STRING', description: 'Filter by sector, stage ("Seed", "Series A"), or risk.' }
      }
    }
  },
  {
    name: 'get_portfolio',
    description: 'Retrieve live portfolio holdings, total valuation calculated from live market quotes, P&L, and asset weights.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'get_watchlist',
    description: 'Retrieve live quotes for monitored watchlist symbols (MSFT, AMZN, TSLA, ETH-USD, SOL-USD).',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  }
];

const STARTUPS_DATA = [
  { symbol: 'NQ', name: 'NeuroQubits', stage: 'Series A', sector: 'Quantum AI Hardware', tam: '$14.2B', score: 94, risk: 'Moderate' },
  { symbol: 'QF', name: 'QuantumFlux', stage: 'Series B', sector: 'Superconducting Computing', tam: '$22.0B', score: 96, risk: 'Low' },
  { symbol: 'SB', name: 'Solenis Bio', stage: 'Seed', sector: 'Synthetic Biology', tam: '$4.8B', score: 89, risk: 'High' },
  { symbol: 'AP', name: 'Aether Photonics', stage: 'Seed', sector: 'Optical AI Interconnects', tam: '$9.5B', score: 91, risk: 'Moderate' },
  { symbol: 'CD', name: 'Cognitive Dynamics', stage: 'Series A', sector: 'Autonomous Robotics', tam: '$18.4B', score: 88, risk: 'Moderate' },
  { symbol: 'SC', name: 'Synapse Cyber', stage: 'Series A', sector: 'Post-Quantum Crypto', tam: '$12.0B', score: 93, risk: 'Low' },
  { symbol: 'DL', name: 'DeepLogic AI', stage: 'Series C', sector: 'Large Reasoning Models', tam: '$45.0B', score: 98, risk: 'Low' }
];

export async function executeTool(name, args = {}) {
  try {
    switch (name) {
      case 'get_live_quotes': {
        const syms = args.symbols || ['NVDA', 'BTC-USD', '^GSPC'];
        return await marketData.getQuotes(syms);
      }

      case 'get_history': {
        const symbol = args.symbol || 'NVDA';
        const days = args.days || 90;
        const interval = args.interval || '1d';
        return await marketData.getHistory(symbol, days, interval);
      }

      case 'get_news_sentiment': {
        const symbol = args.symbol || 'market';
        const news = await marketData.getNews(symbol);
        const headlines = (news.articles || []).map(a => a.headline);
        const sentiment = await mlClient.analyzeNewsSentiment(headlines, symbol);
        return {
          ...sentiment,
          articles: news.articles,
          asOf: news.asOf,
          source: news.source,
          stale: news.stale
        };
      }

      case 'compute_risk_metrics': {
        const pf = await marketData.getLivePortfolioState();
        const hist = await marketData.getHistory('NVDA', 120, '1d');
        const bmHist = await marketData.getHistory('^GSPC', 120, '1d');
        const pfPrices = (hist.candles || []).map(c => c.close);
        const bmPrices = (bmHist.candles || []).map(c => c.close);

        const metrics = await mlClient.computeRiskMetrics(pfPrices, bmPrices);
        return {
          ...metrics,
          portfolioValuation: pf.totalValue,
          asOf: pf.asOf,
          source: 'ml-analytics-live'
        };
      }

      case 'detect_regime': {
        const symbol = args.symbol || '^GSPC';
        const hist = await marketData.getHistory(symbol, 120, '1d');
        const prices = (hist.candles || []).map(c => c.close);
        const regime = await mlClient.detectMarketRegime(prices);
        return {
          symbol,
          ...regime,
          asOf: hist.asOf,
          source: 'ml-clustering'
        };
      }

      case 'detect_anomalies': {
        const symbol = args.symbol || 'NVDA';
        const hist = await marketData.getHistory(symbol, 60, '1d');
        const anomalies = await mlClient.detectAnomalies(hist.candles);
        return {
          symbol,
          ...anomalies,
          asOf: hist.asOf
        };
      }

      case 'forecast_price': {
        const symbol = args.symbol || 'NVDA';
        const horizon = args.horizon || 14;
        const hist = await marketData.getHistory(symbol, 365, '1d');
        const prices = (hist.candles || []).map(c => c.close);
        return await mlClient.forecastPrice(prices, symbol, horizon);
      }

      case 'monte_carlo': {
        const symbol = args.symbol || 'NVDA';
        const horizon = args.horizon || 14;
        const hist = await marketData.getHistory(symbol, 180, '1d');
        const prices = (hist.candles || []).map(c => c.close);
        const currentPrice = prices[prices.length - 1];
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
          returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }
        return await mlClient.runMonteCarlo(currentPrice, returns, horizon);
      }

      case 'optimize_portfolio': {
        const maxTech = typeof args.max_tech_weight === 'number' ? args.max_tech_weight : 0.30;
        const pf = await marketData.getLivePortfolioState();
        return await mlClient.optimizePortfolio(pf.holdings, maxTech);
      }

      case 'run_stress_test': {
        const drop = typeof args.drop_percent === 'number' ? args.drop_percent : 15.0;
        const scenario = args.scenario || 'custom';
        const pf = await marketData.getLivePortfolioState();
        return await mlClient.stressTestSimulation(pf.totalValue, pf.holdings, drop, scenario);
      }

      case 'compare_assets': {
        const syms = args.symbols || ['^GSPC', '^NSEI'];
        return await marketData.getQuotes(syms);
      }

      case 'scan_startups': {
        const crit = (args.criteria || '').toLowerCase();
        let list = STARTUPS_DATA;
        if (crit) {
          list = list.filter(s => s.sector.toLowerCase().includes(crit) || s.stage.toLowerCase().includes(crit) || s.risk.toLowerCase().includes(crit));
        }
        return {
          matchedCount: list.length,
          deals: list,
          asOf: new Date().toISOString()
        };
      }

      case 'get_portfolio': {
        return await marketData.getLivePortfolioState();
      }

      case 'get_watchlist': {
        return await marketData.getQuotes(['MSFT', 'AMZN', 'TSLA', 'ETH-USD', 'SOL-USD']);
      }

      default:
        return { error: `Tool ${name} not recognized` };
    }
  } catch (err) {
    console.error(`[executeTool] Error running ${name}:`, err.message);
    return { error: err.message, tool: name, asOf: new Date().toISOString() };
  }
}
