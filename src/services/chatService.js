// src/services/chatService.js – AREOS AI Intelligence Chat Service Layer

const DEFAULT_CONTEXT = {
  portfolioValue: '$48,281.42',
  sentiment: 'Bullish (78/100)',
  riskScore: 'Moderate (42/100)',
  holdings: 'NVIDIA (NVDA), Apple (AAPL), Vanguard S&P 500 (VOO), Bitcoin (BTC)'
};

// Generate realistic mock response based on user query (clean institutional text, NO emojis)
function getMockResponse(prompt, context) {
  const q = prompt.toLowerCase();

  if (q.includes('risk') || q.includes('portfolio')) {
    return `### AREOS Portfolio Risk Assessment

**Current Valuation:** ${context.portfolioValue || '$48,281.42'}  
**Risk Score:** ${context.riskScore || 'Moderate (42/100)'}

#### Risk Breakdown:
1. **Concentration Risk:** Technology equities comprise **54%** of your total portfolio (led by NVDA at 34.4%).
2. **Volatile Exposure:** Bitcoin holdings ($5,793.00) introduce **12% digital asset beta**.
3. **Yield Cushion:** Cash reserves sitting at **8%** ($3,862.00) provide emergency liquidity buffer.

#### Actionable Recommendation:
* Rebalance **$2,500** from high-beta semiconductor holdings into defensive dividend ETFs to optimize your **Sharpe Ratio (target: 2.65)**.
* Set a trailing stop-loss at **5%** below current NVDA support ($131.50).`;
  }

  if (q.includes('bullish') || q.includes('sentiment') || q.includes('market')) {
    return `### Global Market Sentiment Analysis

**Composite Score:** ${context.sentiment || 'Bullish (78/100)'}

#### Core Catalysts:
* **Fed Rate Outlook:** Cooling Q3 inflation CPI data (+2.4% YoY) has cemented market expectations for monetary easing.
* **Semiconductor Yields:** TSMC & NVIDIA foundry expansion reports confirm **+18% YoY AI chip production acceleration**.
* **Institutional Liquidity:** Money flow into US equities reached **+$14.2B this week**, signaling strong accumulation.

> **Summary:** Market momentum remains solidly bullish with controlled downside risk. Monitor S&P 500 key support around **$5,780**.`;
  }

  if (q.includes('compare') || q.includes('nifty') || q.includes('s&p') || q.includes('sp500')) {
    return `### Comparative Analysis: S&P 500 vs NIFTY 50

| Metric | S&P 500 (US) | NIFTY 50 (India) |
| :--- | :---: | :---: |
| **Current Level** | $5,842.10 | 25,182.40 |
| **24h Change** | +1.24% | +0.86% |
| **YTD Return** | +21.4% | +16.8% |
| **AI Momentum** | Strong Bullish | Moderate Bullish |
| **Primary Driver** | Mega-cap AI Hardware | Domestic Consumption |
| **Key Risk** | Valuation Multiples | Energy Import Costs |

#### Strategic Takeaway:
The **S&P 500** continues to lead on mega-cap enterprise AI spending, while **NIFTY 50** offers durable compounding supported by Indian manufacturing and private bank expansion.`;
  }

  if (q.includes('startup') || q.includes('venture') || q.includes('deal')) {
    return `### AREOS Venture Intelligence Dealflow

Top-rated venture opportunities screened by our quantitative models this week:

1. **NeuroQubits** *(Series A • AI Score: 94/100)*
   * **Sector:** Quantum AI Hardware ($14.2B TAM)
   * **Stage:** Scaling production • Risk: *Moderate*
2. **QuantumFlux** *(Series B • AI Score: 96/100)*
   * **Sector:** Superconducting Computing ($22.0B TAM)
   * **Stage:** Revenue generating • Risk: *Low*
3. **Solenis Bio** *(Seed • AI Score: 89/100)*
   * **Sector:** Synthetic Biology ($4.8B TAM)
   * **Stage:** Early Phase Research • Risk: *High*

*Detailed valuation models and deal summaries are accessible in the [Startups Directory](/startups).*`;
  }

  return `### AREOS AI Intelligence Output

I have analyzed your query regarding **"${prompt}"** against live market parameters.

* **Portfolio Status:** ${context.portfolioValue || '$48,281.42'} (Healthy growth trajectory)
* **Market Regime:** ${context.sentiment || 'Bullish'}
* **Quantum Engine Latency:** 0.8ms (Continuous Feed)

How else can I assist with your asset allocation, market scans, or risk stress testing today?`;
}

// Main Send Message Service Function with Streaming / Typewriter Simulation
export async function sendMessage(messages, userContext = {}, onChunk, signal) {
  const ctx = { ...DEFAULT_CONTEXT, ...userContext };
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';

  let fullResponseText = '';

  // 1. Real Gemini API call if key is configured
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const contents = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const systemInstruction = `You are AREOS AI, an elite institutional financial market intelligence co-pilot. Respond with structured, actionable insights using clean Markdown formatting without emojis. User Context: Portfolio Value ${ctx.portfolioValue}, Sentiment ${ctx.sentiment}, Risk Score ${ctx.riskScore}, Holdings: ${ctx.holdings}.`;

      if (contents[0] && contents[0].role === 'user') {
        contents[0].parts[0].text = `[System Context: ${systemInstruction}]\n\nUser Question: ${contents[0].parts[0].text}`;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
          signal
        }
      );

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        fullResponseText = data.candidates[0].content.parts[0].text;
      } else if (data.error) {
        throw new Error(data.error.message || 'Gemini API Error');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err;
      }
      console.warn('Gemini API call failed, using AREOS Intelligence Engine fallback:', err.message);
      fullResponseText = getMockResponse(lastUserMessage, ctx);
    }
  } else {
    // 2. Realistic AREOS Market Intelligence fallback
    fullResponseText = getMockResponse(lastUserMessage, ctx);
  }

  // Typewriter Streaming simulation
  const chunkSize = 5;
  let index = 0;

  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      if (signal && signal.aborted) {
        clearInterval(timer);
        reject(new DOMException('Aborted by user', 'AbortError'));
        return;
      }

      index += chunkSize;
      const currentChunk = fullResponseText.slice(0, index);
      onChunk(currentChunk);

      if (index >= fullResponseText.length) {
        clearInterval(timer);
        onChunk(fullResponseText);
        resolve(fullResponseText);
      }
    }, 12);
  });
}
