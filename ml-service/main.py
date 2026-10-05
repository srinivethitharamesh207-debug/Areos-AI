# ml-service/main.py - FastAPI Application for Machine Learning & Predictive Analytics
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from nlp import intent_classifier, analyze_sentiment_batch
from ml_analytics import compute_risk_metrics, detect_market_regime, detect_anomalies, predict_short_term_trend
from prediction import generate_forecast, run_monte_carlo
from optimizer import optimize_portfolio, run_stress_test_simulation, rank_startups

app = FastAPI(
    title="Areos AI ML Service",
    description="Quantitative Analytics, NLP Intent Classification, LSTM Forecasting, and Portfolio Optimization Engine",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Request Models
class ClassifyRequest(BaseModel):
    text: str

class SentimentRequest(BaseModel):
    headlines: List[str]
    symbol: Optional[str] = "Market"

class RiskMetricsRequest(BaseModel):
    portfolioPrices: List[float]
    benchmarkPrices: Optional[List[float]] = None
    riskFreeRate: Optional[float] = 0.045

class RegimeRequest(BaseModel):
    prices: List[float]
    window: Optional[int] = 15

class AnomaliesRequest(BaseModel):
    candles: List[Dict[str, Any]]

class TrendRequest(BaseModel):
    prices: List[float]

class ForecastRequest(BaseModel):
    prices: List[float]
    symbol: Optional[str] = "NVDA"
    horizon: Optional[int] = 14

class MonteCarloRequest(BaseModel):
    currentPrice: float
    returns: List[float]
    horizon: Optional[int] = 14
    simulations: Optional[int] = 1000

class RebalanceRequest(BaseModel):
    assets: List[Dict[str, Any]]
    maxTechWeight: Optional[float] = 0.30
    maxSingleWeight: Optional[float] = 0.35

class StressTestRequest(BaseModel):
    portfolioValue: Optional[float] = 48281.42
    holdings: Optional[List[Dict[str, Any]]] = None
    marketShockPercent: Optional[float] = 15.0
    scenario: Optional[str] = "custom"

class StartupScanRequest(BaseModel):
    deals: List[Dict[str, Any]]
    weightGrowth: Optional[float] = 0.40
    weightTAM: Optional[float] = 0.35
    weightRisk: Optional[float] = 0.25

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Areos AI ML Service",
        "intentsLoaded": intent_classifier.is_trained,
        "features": ["NLP", "Risk Metrics", "LSTM Forecasting", "Mean-Variance Optimizer", "Monte Carlo"]
    }

@app.post("/nlp/classify")
def classify_text(req: ClassifyRequest):
    return intent_classifier.classify(req.text)

@app.post("/nlp/sentiment")
def sentiment_analysis(req: SentimentRequest):
    return analyze_sentiment_batch(req.headlines, req.symbol)

@app.post("/ml/risk-metrics")
def risk_metrics_endpoint(req: RiskMetricsRequest):
    return compute_risk_metrics(req.portfolioPrices, req.benchmarkPrices, req.riskFreeRate)

@app.post("/ml/regime")
def regime_endpoint(req: RegimeRequest):
    return detect_market_regime(req.prices, req.window)

@app.post("/ml/anomalies")
def anomalies_endpoint(req: AnomaliesRequest):
    return detect_anomalies(req.candles)

@app.post("/ml/trend")
def trend_endpoint(req: TrendRequest):
    return predict_short_term_trend(req.prices)

@app.post("/predict/forecast")
def forecast_endpoint(req: ForecastRequest):
    try:
        return generate_forecast(req.prices, req.symbol, req.horizon)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/predict/monte-carlo")
def monte_carlo_endpoint(req: MonteCarloRequest):
    import numpy as np
    returns_arr = np.array(req.returns, dtype=float)
    return run_monte_carlo(req.currentPrice, returns_arr, req.horizon, req.simulations)

@app.post("/optimize/rebalance")
def rebalance_endpoint(req: RebalanceRequest):
    return optimize_portfolio(
        assets=req.assets,
        max_tech_weight=req.maxTechWeight,
        max_single_weight=req.maxSingleWeight
    )

@app.post("/optimize/stress-test")
def stress_test_endpoint(req: StressTestRequest):
    return run_stress_test_simulation(
        portfolio_value=req.portfolioValue,
        holdings=req.holdings,
        market_shock_pct=req.marketShockPercent,
        scenario=req.scenario
    )

@app.post("/optimize/startups")
def startups_endpoint(req: StartupScanRequest):
    return rank_startups(req.deals, req.weightGrowth, req.weightTAM, req.weightRisk)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
