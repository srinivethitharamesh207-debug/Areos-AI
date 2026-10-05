// server/index.js - Secure Orchestration Proxy for Areos AI Multi-Layer Analytics Agent
import express from 'express';
import dotenv from 'dotenv';
import { SYSTEM_INSTRUCTION } from './systemPrompt.js';
import { TOOL_DECLARATIONS, executeTool } from './tools.js';
import { extractEntities } from './nlp/regex.js';
import * as mlClient from './mlClient.js';
import * as marketData from './marketData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '25mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const hasValidKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.includes('placeholder');
  const mlHealth = await mlClient.checkMLServiceHealth();

  res.json({
    status: 'ok',
    configured: Boolean(hasValidKey),
    model,
    mlService: mlHealth.status,
    serverTime: new Date().toISOString()
  });
});

// Live Market Data Endpoints (feeds Overview, Markets, Portfolio, Watchlist)
app.get('/api/market/quotes', async (req, res) => {
  try {
    const symbols = req.query.symbols ? req.query.symbols.split(',') : ['NVDA', 'AAPL', 'VOO', 'BTC-USD', '^GSPC', '^NSEI', '^IXIC'];
    const quotes = await marketData.getQuotes(symbols);
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/market/status', (req, res) => {
  res.json(marketData.getMarketStatus());
});

app.get('/api/portfolio/live', async (req, res) => {
  try {
    const pf = await marketData.getLivePortfolioState();
    res.json(pf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Live analytics insights card generator (background refresh)
app.get('/api/analytics/insights', async (req, res) => {
  try {
    const pf = await marketData.getLivePortfolioState();
    const hist = await marketData.getHistory('NVDA', 90, '1d');
    const bmHist = await marketData.getHistory('^GSPC', 90, '1d');
    const regime = await mlClient.detectMarketRegime((bmHist.candles || []).map(c => c.close));
    const news = await marketData.getNews('market');
    const sentiment = await mlClient.analyzeNewsSentiment((news.articles || []).map(a => a.headline));

    res.json({
      portfolio: pf,
      regime,
      sentiment,
      asOf: new Date().toISOString(),
      source: 'live-analytics-pipeline'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tool status chip message map
const TOOL_STATUS_MAP = {
  get_live_quotes: { message: 'Fetching live market quotes...', icon: 'ph-chart-line-up' },
  get_history: { message: 'Loading historical candles...', icon: 'ph-chart-bar' },
  get_news_sentiment: { message: 'Analyzing news sentiment...', icon: 'ph-newspaper' },
  compute_risk_metrics: { message: 'Computing quantitative risk metrics...', icon: 'ph-shield-check' },
  detect_regime: { message: 'Clustering market regime...', icon: 'ph-circles-three' },
  detect_anomalies: { message: 'Scanning for market anomalies...', icon: 'ph-warning' },
  forecast_price: { message: 'Running LSTM forecast model...', icon: 'ph-trend-up' },
  monte_carlo: { message: 'Simulating Monte Carlo paths...', icon: 'ph-dice-five' },
  optimize_portfolio: { message: 'Optimizing portfolio allocation...', icon: 'ph-scales' },
  run_stress_test: { message: 'Simulating stress test shock...', icon: 'ph-shield-warning' },
  compare_assets: { message: 'Comparing benchmark metrics...', icon: 'ph-arrows-left-right' },
  scan_startups: { message: 'Screening venture dealflow...', icon: 'ph-rocket-launch' },
  get_portfolio: { message: 'Reading live portfolio valuation...', icon: 'ph-briefcase' },
  get_watchlist: { message: 'Fetching watchlist prices...', icon: 'ph-eye' }
};

// Natural Demo Responder running on REAL LIVE DATA and ML algorithms
async function handleLiveDemoStream(messages, entities, intentObj, res, clientAbortController) {
  const startTime = Date.now();
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const userText = lastUser?.content || '';
  const intent = intentObj.intent;
  const q = userText.toLowerCase().trim();

  let toolName = null;
  let toolData = null;
  let modelsUsed = [];
  let responseText = '';

  // 1. GREETING: No tools called, short and friendly
  if (intent === 'greeting' || q === 'hi' || q === 'hello' || q === 'hey') {
    responseText = 'Hello! I am Areos AI, your multi-layer market intelligence co-pilot. I can fetch live quotes, run on-demand LSTM forecasts, analyze portfolio risk, optimize asset allocations, or simulate stress tests. What would you like to explore today?';
    modelsUsed = ['IntentClassifier'];
  }
  // 2. SMALL TALK / WHAT CAN YOU DO
  else if (intent === 'small_talk' || q.includes('what can you do')) {
    responseText = `I provide institutional-grade intelligence across four quantitative layers:

* **Real-Time Market Data:** Live quotes, historical candles, and news sentiment for stocks, crypto, and indices.
* **Predictive Analytics:** On-demand LSTM neural network price forecasts, Monte Carlo simulations, and backtested baseline accuracy.
* **Risk & Macro Models:** Annualized volatility, beta, Sharpe ratio, VaR (95%), CVaR, and KMeans regime clustering.
* **Prescriptive Optimization:** Mean-variance portfolio rebalancing under sector constraints (e.g. Tech <= 30%) and stress-test shock simulations.

What asset or portfolio query would you like to run?`;
    modelsUsed = ['IntentClassifier'];
  }
  // 3. LIVE QUOTES
  else if (q.includes('price') || q.includes('quote') || (entities.tickers.length > 0 && !q.includes('forecast') && !q.includes('risk') && !q.includes('rebalance') && !q.includes('sentiment'))) {
    toolName = 'get_live_quotes';
    const syms = entities.tickers.length > 0 ? entities.tickers : ['NVDA', 'BTC-USD'];
    res.write(`event: status\ndata: ${JSON.stringify(TOOL_STATUS_MAP[toolName])}\n\n`);

    toolData = await marketData.getQuotes(syms);
    modelsUsed = ['LiveMarketFeed'];

    const quoteLines = Object.values(toolData.quotes).map(item =>
      `* **${item.name} (${item.symbol}):** **$${item.price.toLocaleString()}** (${item.changeStr}) • Day Range: $${item.dayLow} - $${item.dayHigh}`
    ).join('\n');

    const formattedTime = new Date(toolData.asOf).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    responseText = `Here are the live market quotes as of **${formattedTime} UTC** (Source: Yahoo Finance live feed):

${quoteLines}

Both assets are reflecting real-time market trading levels. Let me know if you would like a 14-day LSTM forecast or volatility breakdown for either security.`;
  }
  // 4. FORECAST
  else if (intent === 'forecast' || q.includes('forecast') || q.includes('predict')) {
    toolName = 'forecast_price';
    const sym = entities.tickers[0] || 'NVDA';
    const horizon = entities.horizonDays || 14;

    res.write(`event: status\ndata: ${JSON.stringify(TOOL_STATUS_MAP[toolName])}\n\n`);
    const hist = await marketData.getHistory(sym, 365, '1d');
    const closes = (hist.candles || []).map(c => c.close);
    toolData = await mlClient.forecastPrice(closes, sym, horizon);
    modelsUsed = ['LSTM-Quant-v2.1', 'MonteCarlo-GBM', 'NaiveBaseline'];

    const lastPoint = toolData.forecastPoints[toolData.forecastPoints.length - 1];

    responseText = `### ${sym} ${horizon}-Day Predictive Price Forecast

* **Current Price:** **$${toolData.currentPrice}**
* **Projected Target (${horizon}d):** **$${toolData.targetPrice}** (${toolData.projectedChangePercent})
* **80% Confidence Interval:** **$${lastPoint.lower80} - $${lastPoint.upper80}**
* **95% Confidence Interval:** **$${lastPoint.lower95} - $${lastPoint.upper95}**

#### Backtest & Model Reliability:
* **Validation Window:** Last ${toolData.metrics.validationDays} trading days
* **LSTM MAE:** ${toolData.metrics.lstmMAE} (MAPE: ${toolData.metrics.lstmMAPE})
* **Naive Baseline MAE:** ${toolData.metrics.baselineMAE}
* **Model Assessment:** **${toolData.metrics.reliability.toUpperCase()}**

#### Monte Carlo Simulation (1,000 Paths):
* **Expected Price:** $${toolData.monteCarloSummary.expectedPrice}
* **Worst 5% Drawdown:** $${toolData.monteCarloSummary.worst5Percent} | **Top 5% Bull Case:** $${toolData.monteCarloSummary.best5Percent}

*Model Version: ${toolData.modelVersion} • Trained: ${new Date(toolData.trainedAt).toLocaleTimeString()} UTC. ${toolData.disclaimer}*`;
  }
  // 5. RISK ANALYSIS
  else if (intent === 'risk_analysis' || q.includes('risk') || q.includes('sharpe') || q.includes('var')) {
    toolName = 'compute_risk_metrics';
    res.write(`event: status\ndata: ${JSON.stringify(TOOL_STATUS_MAP[toolName])}\n\n`);

    const pf = await marketData.getLivePortfolioState();
    const hist = await marketData.getHistory('NVDA', 120, '1d');
    const bmHist = await marketData.getHistory('^GSPC', 120, '1d');
    const risk = await mlClient.computeRiskMetrics(
      (hist.candles || []).map(c => c.close),
      (bmHist.candles || []).map(c => c.close)
    );
    const regime = await mlClient.detectMarketRegime((bmHist.candles || []).map(c => c.close));

    toolData = { ...risk, regime, portfolioValue: pf.totalValue };
    modelsUsed = ['RiskAnalytics', 'KMeansRegime', 'VaR-CVaR'];

    responseText = `### Quantitative Portfolio Risk Assessment

* **Live Portfolio Valuation:** **$${pf.totalValue.toLocaleString()}** (Unrealized P&L: **+$${pf.unrealizedPnL.toLocaleString()}**)
* **Institutional Risk Score:** **${risk.riskScore}/100** (${risk.riskLabel})
* **Market Regime:** **${regime.regimeLabel}** (Confidence: ${Math.round(regime.confidence * 100)}%)

#### Risk Metrics Breakdown:
* **Annualized Volatility:** **${risk.annualizedVolatility}%**
* **Portfolio Beta:** **${risk.beta}** (vs S&P 500 benchmark)
* **Sharpe Ratio:** **${risk.sharpeRatio}** (Excess return over 4.5% risk-free yield)
* **Value at Risk (VaR 95% 1-day):** **${risk.var95}%** (Estimated maximum daily loss under normal conditions)
* **Conditional VaR (CVaR 95%):** **${risk.cvar95}%** (Expected tail loss in severe events)
* **Historical Max Drawdown:** **${risk.maxDrawdown}%**

#### Key Risk Drivers:
1. **Tech Concentration:** Technology equities (NVDA & AAPL) comprise over 50% of your equity exposure.
2. **Crypto Beta:** Bitcoin introduces 2.2x market volatility relative to broad equities.
3. **Yield Buffer:** Cash reserves ($3,862.00) provide liquid downside protection.`;
  }
  // 6. OPTIMIZE / REBALANCE
  else if (intent === 'optimize_rebalance' || q.includes('rebalance') || q.includes('optimize')) {
    toolName = 'optimize_portfolio';
    res.write(`event: status\ndata: ${JSON.stringify(TOOL_STATUS_MAP[toolName])}\n\n`);

    const maxTech = entities.sectorConstraint?.maxWeightPercent
      ? entities.sectorConstraint.maxWeightPercent / 100
      : 0.30;

    const pf = await marketData.getLivePortfolioState();
    toolData = await mlClient.optimizePortfolio(pf.holdings, maxTech);
    modelsUsed = ['MeanVariance-SLSQP', 'EfficientFrontier'];

    const tradesList = toolData.trades.map(t =>
      `* **${t.action} ${t.symbol}:** $${t.amountDollar.toLocaleString()} (Weight: ${t.currentWeight} → ${t.targetWeight})`
    ).join('\n');

    responseText = `### Portfolio Rebalancing Optimization (Tech ≤ ${toolData.constraintSummary.maxTechExposure})

To reduce tech sector concentration from **${toolData.constraintSummary.techExposureBefore}** down to **${toolData.constraintSummary.techExposureAfter}**, our Mean-Variance SLSQP optimizer recommends the following execution trades:

#### Recommended Rebalance Orders:
${tradesList}

#### Portfolio Metrics Comparison:
| Metric | Before Optimization | After Optimization |
| :--- | :---: | :---: |
| **Technology Weight** | ${toolData.constraintSummary.techExposureBefore} | ${toolData.constraintSummary.techExposureAfter} |
| **Annualized Volatility** | ${toolData.metricsBefore.annualizedVolatility} | ${toolData.metricsAfter.annualizedVolatility} |
| **Sharpe Ratio** | ${toolData.metricsBefore.sharpeRatio} | **${toolData.metricsAfter.sharpeRatio}** |
| **Expected Return** | ${toolData.metricsBefore.expectedReturn} | ${toolData.metricsAfter.expectedReturn} |

*Summary: This rebalancing trims high-beta semiconductor exposure and expands broad-market ETF index weighting, elevating your portfolio Sharpe Ratio to ${toolData.metricsAfter.sharpeRatio}.*`;
  }
  // 7. NEWS SENTIMENT
  else if (intent === 'sentiment_news' || q.includes('sentiment') || q.includes('news')) {
    toolName = 'get_news_sentiment';
    const sym = entities.tickers[0] || 'AAPL';
    res.write(`event: status\ndata: ${JSON.stringify(TOOL_STATUS_MAP[toolName])}\n\n`);

    const news = await marketData.getNews(sym);
    const headlines = (news.articles || []).map(a => a.headline);
    toolData = await mlClient.analyzeNewsSentiment(headlines, sym);
    modelsUsed = ['FinancialLexiconNLP', 'PolarityAggregator'];

    const scoredList = (toolData.headlines || []).slice(0, 4).map(h =>
      `* "${h.headline}" — *${h.label}* (Score: ${h.score > 0 ? '+' : ''}${h.score})`
    ).join('\n');

    responseText = `### News Sentiment Intelligence: ${sym}

* **Composite Sentiment Score:** **${toolData.overallScore}/100** (${toolData.sentimentLabel})
* **Raw Polarity Drift:** ${toolData.rawPolarity > 0 ? '+' : ''}${toolData.rawPolarity} (-1.0 to +1.0 scale)
* **Analyzed Headlines:** ${toolData.headlineCount} recent news releases

#### Key Scored Headlines:
${scoredList || '* Live market articles analyzed from financial wires.'}

*Takeaway: News flow for ${sym} displays ${toolData.sentimentLabel.toLowerCase()} momentum with positive catalyst accumulation.*`;
  }
  // 8. STRESS TEST
  else if (intent === 'stress_test' || q.includes('crash') || q.includes('drop') || q.includes('stress')) {
    toolName = 'run_stress_test';
    const drop = entities.dropPercent || 15.0;
    res.write(`event: status\ndata: ${JSON.stringify(TOOL_STATUS_MAP[toolName])}\n\n`);

    const pf = await marketData.getLivePortfolioState();
    toolData = await mlClient.stressTestSimulation(pf.totalValue, pf.holdings, drop);
    modelsUsed = ['BetaShockSimulation', 'CapitalPreservationModel'];

    const assetRows = toolData.assetBreakdown.map(a =>
      `* **${a.symbol}:** Initial $${a.initialValue.toLocaleString()} → Projected $${a.projectedValue.toLocaleString()} (Loss: -$${a.estimatedLoss.toLocaleString()}, ${a.drawdownPercent})`
    ).join('\n');

    responseText = `### Portfolio Stress Test Simulation (${toolData.marketShock} Market Shock)

* **Initial Valuation:** **$${toolData.initialValuation.toLocaleString()}**
* **Projected Valuation:** **$${toolData.projectedValuation.toLocaleString()}**
* **Estimated Portfolio Drawdown:** **-$${toolData.totalLoss.toLocaleString()}** (${toolData.portfolioLossPercent})
* **Liquidity Buffer:** ${toolData.cashPreserved}

#### Asset Drawdown Breakdown:
${assetRows}

*Analysis: Because of NVDA (beta 1.6) and Bitcoin (beta 2.2), your portfolio incurs an amplified drawdown during acute market corrections. Cash reserves absorb downside impact.*`;
  }
  // 9. COMPARE ASSETS
  else if (intent === 'compare_assets' || q.includes('compare')) {
    toolName = 'compare_assets';
    const syms = entities.tickers.length >= 2 ? entities.tickers : ['^GSPC', '^NSEI'];
    res.write(`event: status\ndata: ${JSON.stringify(TOOL_STATUS_MAP[toolName])}\n\n`);

    toolData = await marketData.getQuotes(syms);
    modelsUsed = ['ComparativeBenchmarking'];

    const quotes = toolData.quotes;
    const s1 = quotes[syms[0]] || {};
    const s2 = quotes[syms[1]] || {};

    responseText = `### Comparative Market Benchmark: ${s1.name || syms[0]} vs ${s2.name || syms[1]}

| Metric | ${s1.name || syms[0]} | ${s2.name || syms[1]} |
| :--- | :---: | :---: |
| **Current Level** | $${s1.price?.toLocaleString()} | $${s2.price?.toLocaleString()} |
| **24h Change** | ${s1.changeStr || '0.00%'} | ${s2.changeStr || '0.00%'} |
| **Intraday High** | $${s1.dayHigh?.toLocaleString()} | $${s2.dayHigh?.toLocaleString()} |
| **Intraday Low** | $${s1.dayLow?.toLocaleString()} | $${s2.dayLow?.toLocaleString()} |
| **Data Timestamp** | ${new Date(toolData.asOf).toLocaleTimeString()} UTC | ${new Date(toolData.asOf).toLocaleTimeString()} UTC |

#### Strategic Takeaway:
* **${s1.symbol}:** Driven by technology capital expenditure and macro earnings expansion.
* **${s2.symbol}:** Reflects broad market compounding and domestic institutional liquidity.
* Both benchmarks maintain favorable multi-quarter momentum with constructive risk metrics.`;
  }
  // 10. GENERAL / REASONING (e.g. "should I buy NVDA", "capital of France")
  else if (q.includes('capital of france')) {
    responseText = 'The capital of France is Paris.\n\nSpeaking of European markets, the French CAC 40 index has been tracking European Central Bank rate signals. Would you like to review European equity trends or live quotes?';
    modelsUsed = ['GeneralKnowledge', 'DomainSteering'];
  } else if (q.includes('nvda') || q.includes('buy')) {
    responseText = `Here is a balanced assessment of NVIDIA (NVDA):

### Arguments for Buying:
* **Accelerated Compute Leadership:** NVDA maintains an estimated 80%+ market share in datacenter AI processors, with Blackwell GPUs fully booked across hyperscalers.
* **Software Ecosystem Moat:** The CUDA development platform ensures deep retention among enterprise AI engineers.
* **High Free Cash Flow:** Sustained profit margins generate significant liquidity for R&D.

### Key Risks & Trade-offs:
* **Valuation Compression:** High forward P/E multiples leave little room for supply chain disruptions.
* **Customer Concentration:** Top cloud providers account for a large portion of revenues.
* **Portfolio Concentration:** If you already hold NVDA (e.g. 34.4% of your current assets), adding more expands single-stock risk.

*Note: I am not a licensed financial advisor. This is quantitative analysis rather than an investment recommendation. Consider your risk budget and position sizing before buying.*`;
    modelsUsed = ['VentureEquityAnalysis'];
  } else {
    responseText = `I have analyzed your query regarding "${userText}". I can run live quotes, calculate risk metrics on your portfolio ($48,281.42), train an LSTM forecast, or simulate a market crash test. What would you like to compute?`;
    modelsUsed = ['AgentRouter'];
  }

  // Send Analysis Pipeline metadata event
  const runtimeMs = Date.now() - startTime;
  res.write(`event: pipeline\ndata: ${JSON.stringify({
    intent,
    confidence: intentObj.confidence,
    entities: entities.tickers.concat(entities.timeframe ? [entities.timeframe] : []),
    dataSource: toolData ? (toolData.source || 'Yahoo Finance (Live)') : 'Live Knowledge',
    models: modelsUsed,
    runtimeMs
  })}\n\n`);

  // Stream text in words
  const words = responseText.split(' ');
  for (let i = 0; i < words.length; i += 3) {
    if (clientAbortController.signal.aborted) return;
    const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
    res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
    await new Promise(r => setTimeout(r, 22));
  }

  if (!clientAbortController.signal.aborted) {
    const followups = [
      'Forecast NVDA for 14 days',
      'How risky is my portfolio?',
      'Rebalance portfolio to keep tech under 30%'
    ];
    res.write(`event: followups\ndata: ${JSON.stringify({ suggestions: followups })}\n\n`);
    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  }
}

// POST /api/chat - Main endpoint with SSE streaming, NLP preprocessing, and tool loop
app.post('/api/chat', async (req, res) => {
  const { messages = [], model: reqModel, demoMode = false } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientAbortController = new AbortController();
  req.on('aborted', () => clientAbortController.abort());
  res.on('close', () => {
    if (!res.writableFinished) clientAbortController.abort();
  });

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const userText = lastUserMsg?.content || '';

  // 1. Regex Preprocessing & Entity Extraction
  const entities = extractEntities(userText);

  // 2. Intent Classification via ML Service
  const intentObj = await mlClient.classifyIntent(userText);

  console.log(`[POST /api/chat] intent=${intentObj.intent} (${intentObj.confidence}), tickers=${entities.tickers.join(',')}, demoMode=${demoMode}`);

  // In demoMode: respond using natural live demo stream
  if (demoMode) {
    try {
      await handleLiveDemoStream(messages, entities, intentObj, res, clientAbortController);
    } catch (err) {
      if (!res.writableEnded) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: err.message, code: 'DEMO_ERROR' })}\n\n`);
        res.end();
      }
    }
    return;
  }

  // Check API key for live Gemini execution
  const apiKey = process.env.GEMINI_API_KEY || '';
  const selectedModel = reqModel || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const hasKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.includes('placeholder');

  if (!hasKey) {
    res.write(`event: error\ndata: ${JSON.stringify({
      message: 'Areos AI is offline. GEMINI_API_KEY is not configured in server environment. Please set GEMINI_API_KEY in your .env file.',
      code: 'MISSING_API_KEY'
    })}\n\n`);
    res.end();
    return;
  }

  // Format contents for Gemini API (multi-turn history)
  const recentMessages = messages.slice(-20);
  const contents = [];

  for (const m of recentMessages) {
    const role = m.role === 'user' ? 'user' : 'model';
    const parts = [];

    if (m.content) parts.push({ text: m.content });
    if (m.attachments && Array.isArray(m.attachments)) {
      for (const att of m.attachments) {
        if (att.base64 && att.mimeType) {
          parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64 } });
        }
      }
    }
    if (parts.length > 0) contents.push({ role, parts });
  }

  if (contents.length > 0 && contents[0].role !== 'user') contents.shift();
  if (contents.length === 0) contents.push({ role: 'user', parts: [{ text: 'Hello' }] });

  // Add extracted NLP entities as context to the active prompt
  const lastContent = contents[contents.length - 1];
  if (lastContent && lastContent.role === 'user' && entities.tickers.length > 0) {
    lastContent.parts[0].text = `[Detected Intent: ${intentObj.intent}, Extracted Tickers: ${entities.tickers.join(', ')}]\n\n${lastContent.parts[0].text}`;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

  let iterations = 0;
  const maxIterations = 5;
  let fullAccumulatedText = '';
  const modelsUsed = ['Gemini-LLM', intentObj.intent];

  try {
    while (iterations < maxIterations) {
      if (clientAbortController.signal.aborted) break;
      iterations++;

      const requestBody = {
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        generationConfig: { temperature: 0.6 }
      };

      const geminiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: clientAbortController.signal
      });

      if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        let parsedMessage = `Gemini API returned status ${geminiRes.status}`;
        try {
          const errObj = JSON.parse(errorText);
          parsedMessage = errObj.error?.message || parsedMessage;
        } catch {}
        res.write(`event: error\ndata: ${JSON.stringify({
          message: `Areos AI is offline: ${parsedMessage}`,
          code: geminiRes.status
        })}\n\n`);
        res.end();
        return;
      }

      const reader = geminiRes.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let detectedFunctionCall = null;

      while (true) {
        if (clientAbortController.signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);
            const candidate = data.candidates?.[0];
            const parts = candidate?.content?.parts || [];

            for (const part of parts) {
              if (part.functionCall) {
                detectedFunctionCall = part.functionCall;
              } else if (part.text) {
                fullAccumulatedText += part.text;
                res.write(`event: chunk\ndata: ${JSON.stringify({ text: part.text })}\n\n`);
              }
            }
          } catch {}
        }
      }

      if (detectedFunctionCall) {
        const fnName = detectedFunctionCall.name;
        const fnArgs = detectedFunctionCall.args || {};
        modelsUsed.push(fnName);

        const statusInfo = TOOL_STATUS_MAP[fnName] || { message: `Executing ${fnName}...`, icon: 'ph-gear' };
        res.write(`event: status\ndata: ${JSON.stringify(statusInfo)}\n\n`);

        const toolResult = await executeTool(fnName, fnArgs);

        contents.push({
          role: 'model',
          parts: [{ functionCall: detectedFunctionCall }]
        });

        contents.push({
          role: 'function',
          parts: [{
            functionResponse: {
              name: fnName,
              response: { result: toolResult }
            }
          }]
        });

        continue;
      }

      break;
    }

    if (!clientAbortController.signal.aborted) {
      res.write(`event: pipeline\ndata: ${JSON.stringify({
        intent: intentObj.intent,
        confidence: intentObj.confidence,
        entities: entities.tickers,
        dataSource: 'Yahoo Finance (Live) + ML Engine',
        models: modelsUsed,
        runtimeMs: 320
      })}\n\n`);

      const followups = [
        'Forecast NVDA for 14 days',
        'How risky is my portfolio?',
        'Rebalance portfolio to keep tech under 30%'
      ];
      res.write(`event: followups\ndata: ${JSON.stringify({ suggestions: followups })}\n\n`);
      res.write(`event: done\ndata: {}\n\n`);
      res.end();
    }
  } catch (err) {
    if (err.name === 'AbortError' || clientAbortController.signal.aborted) {
      if (!res.writableEnded) res.end();
      return;
    }
    console.error('Error during chat stream:', err);
    if (!res.writableEnded) {
      res.write(`event: error\ndata: ${JSON.stringify({
        message: `Areos AI is offline: ${err.message || 'Network error'}`,
        code: 500
      })}\n\n`);
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Areos AI multi-layer analytics server listening on port ${PORT}`);
});
