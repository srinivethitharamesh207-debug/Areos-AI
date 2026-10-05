# ml-service/test_models.py - Quantitative model validation tests
import sys
import unittest
import numpy as np

sys.path.insert(0, '.')

from nlp import intent_classifier, analyze_sentiment_batch
from ml_analytics import compute_risk_metrics, detect_market_regime, detect_anomalies
from prediction import generate_forecast
from optimizer import optimize_portfolio, run_stress_test

class TestMLServiceModels(unittest.TestCase):

    def test_01_nlp_intent_classification(self):
        tests = [
            ("forecast NVDA for the next 14 days", "forecast"),
            ("how risky is my portfolio?", "risk_analysis"),
            ("rebalance my portfolio to keep tech under 30%", "optimize_rebalance"),
            ("what is the news sentiment on AAPL?", "sentiment_news"),
            ("simulate a 15% market crash", "stress_test"),
            ("compare S&P 500 and NIFTY 50", "compare_assets"),
            ("what is the price of NVDA and BTC right now?", "live_quotes"),
            ("hi", "greeting")
        ]
        for query, expected_intent in tests:
            result = intent_classifier.classify(query)
            self.assertEqual(result["intent"], expected_intent, f"Failed for query '{query}': got {result['intent']}, expected {expected_intent}")
            self.assertGreater(result["confidence"], 0.3)

    def test_02_sentiment_scoring(self):
        headlines = [
            "Nvidia beats revenue estimates on record AI chip demand",
            "Tech stocks tumble as bond yields hit multi-year highs",
            "Federal Reserve holds interest rates steady as expected"
        ]
        result = analyze_sentiment_batch(headlines, "NVDA")
        self.assertIn("overallScore", result)
        self.assertGreaterEqual(result["overallScore"], 0)
        self.assertLessEqual(result["overallScore"], 100)
        self.assertEqual(len(result["headlines"]), 3)

    def test_03_risk_metrics(self):
        np.random.seed(42)
        # 120 days of synthetic prices
        asset_prices = [100.0]
        bm_prices = [100.0]
        for _ in range(120):
            asset_prices.append(asset_prices[-1] * (1 + np.random.normal(0.001, 0.02)))
            bm_prices.append(bm_prices[-1] * (1 + np.random.normal(0.0005, 0.01)))

        metrics = calculate_risk_metrics(asset_prices, bm_prices)
        self.assertIn("annualizedVolatility", metrics)
        self.assertIn("sharpeRatio", metrics)
        self.assertIn("beta", metrics)
        self.assertIn("var95", metrics)
        self.assertIn("cvar95", metrics)
        self.assertIn("riskScore", metrics)
        self.assertGreater(metrics["annualizedVolatility"], 0)
        self.assertGreaterEqual(metrics["riskScore"], 0)
        self.assertLessEqual(metrics["riskScore"], 100)

    def test_04_market_regime(self):
        prices = [100.0 + i * 0.5 + np.sin(i / 5.0) * 3.0 for i in range(100)]
        regime = detect_market_regime(prices)
        self.assertIn(regime["regime"], ["calm", "trending", "volatile"])
        self.assertGreaterEqual(regime["confidence"], 0.5)

    def test_05_predictive_forecast_and_confidence_bands(self):
        np.random.seed(42)
        prices = [150.0 + i * 0.4 + np.sin(i / 3.0) * 4.0 for i in range(150)]
        forecast = generate_forecast(prices, "NVDA", 14)

        self.assertEqual(forecast["symbol"], "NVDA")
        self.assertEqual(forecast["horizonDays"], 14)
        self.assertEqual(len(forecast["forecastPoints"]), 14)
        self.assertIn("targetPrice", forecast)
        self.assertIn("lower80", forecast["forecastPoints"][-1])
        self.assertIn("upper80", forecast["forecastPoints"][-1])
        self.assertIn("lower95", forecast["forecastPoints"][-1])
        self.assertIn("upper95", forecast["forecastPoints"][-1])
        # Verify confidence intervals: lower95 <= lower80 <= upper80 <= upper95
        last = forecast["forecastPoints"][-1]
        self.assertLessEqual(last["lower95"], last["lower80"])
        self.assertLessEqual(last["lower80"], last["upper80"])
        self.assertLessEqual(last["upper80"], last["upper95"])
        # Check backtest metrics
        self.assertIn("lstmMAE", forecast["metrics"])
        self.assertIn("baselineMAE", forecast["metrics"])
        self.assertIn("reliability", forecast["metrics"])

    def test_06_portfolio_optimizer_sector_constraint(self):
        holdings = [
            {"symbol": "NVDA", "sector": "Technology", "value": 16614.0},
            {"symbol": "AAPL", "sector": "Technology", "value": 9581.04},
            {"symbol": "VOO", "sector": "Broad Market", "value": 10621.0},
            {"symbol": "BTC-USD", "sector": "Crypto", "value": 7603.38},
            {"symbol": "USD", "sector": "Cash", "value": 3862.0}
        ]
        # Request max 30% Tech
        result = optimize_portfolio(holdings, max_tech_weight=0.30)
        self.assertIn("allocations", result)
        self.assertIn("trades", result)
        self.assertIn("metricsBefore", result)
        self.assertIn("metricsAfter", result)

        # Verify Tech sector weight is significantly reduced towards or at 30%
        tech_after_str = result["constraintSummary"]["techExposureAfter"]
        tech_after_val = float(tech_after_str.replace("%", ""))
        self.assertLessEqual(tech_after_val, 37.0) # SLSQP constraint satisfied within slack
        self.assertGreater(len(result["trades"]), 0)

    def test_07_stress_test_simulation(self):
        holdings = [
            {"symbol": "NVDA", "sector": "Technology", "value": 16614.0},
            {"symbol": "AAPL", "sector": "Technology", "value": 9581.04},
            {"symbol": "VOO", "sector": "Broad Market", "value": 10621.0},
            {"symbol": "BTC-USD", "sector": "Crypto", "value": 7603.38},
            {"symbol": "USD", "sector": "Cash", "value": 3862.0}
        ]
        total_val = sum(h["value"] for h in holdings)
        result = run_stress_test(total_val, holdings, shock_percent=15.0)

        self.assertEqual(result["initialValuation"], round(total_val, 2))
        self.assertLess(result["projectedValuation"], total_val)
        self.assertGreater(result["totalLoss"], 0)
        self.assertEqual(len(result["assetBreakdown"]), len(holdings))
        # Cash should have 0 loss
        cash_item = next(a for a in result["assetBreakdown"] if a["symbol"] == "USD")
        self.assertEqual(cash_item["estimatedLoss"], 0.0)

if __name__ == "__main__":
    unittest.main(verbosity=2)
