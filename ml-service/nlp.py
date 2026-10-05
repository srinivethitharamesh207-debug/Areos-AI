# ml-service/nlp.py - Lightweight Intent Classifier and Financial Sentiment Engine
import json
import os
import re
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
INTENTS_FILE = os.path.join(CURRENT_DIR, "data", "intents.json")

class IntentClassifier:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), lowercase=True, stop_words="english")
        self.model = LogisticRegression(C=10.0, max_iter=500)
        self.is_trained = False
        self._train()

    def _train(self):
        if not os.path.exists(INTENTS_FILE):
            print(f"[IntentClassifier] Warning: {INTENTS_FILE} not found.")
            return

        with open(INTENTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        texts = []
        labels = []
        for intent, examples in data.items():
            for text in examples:
                texts.append(text)
                labels.append(intent)

        X = self.vectorizer.fit_transform(texts)
        self.model.fit(X, labels)
        self.is_trained = True
        print(f"[IntentClassifier] Trained on {len(texts)} examples across {len(data)} intents.")

    def classify(self, text: str) -> Dict[str, Any]:
        if not self.is_trained or not text.strip():
            return {
                "intent": "general_question",
                "confidence": 0.5,
                "top_intents": []
            }

        X = self.vectorizer.transform([text])
        probs = self.model.predict_proba(X)[0]
        classes = self.model.classes_

        ranked = sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)
        top_intent, top_conf = ranked[0]

        return {
            "intent": str(top_intent),
            "confidence": round(float(top_conf), 3),
            "top_intents": [{"intent": str(k), "confidence": round(float(v), 3)} for k, v in ranked[:3]]
        }

# Financial Lexicon for News Sentiment
FIN_LEXICON_POSITIVE = {
    "surge": 0.8, "jump": 0.7, "gain": 0.6, "soar": 0.85, "rally": 0.75, "beat": 0.7,
    "growth": 0.6, "bullish": 0.8, "record": 0.65, "record-high": 0.9, "boost": 0.6,
    "profit": 0.65, "upgrade": 0.75, "outperform": 0.8, "expanding": 0.55, "high": 0.4,
    "opportunity": 0.5, "accelerate": 0.7, "easing": 0.55, "breakthrough": 0.85,
    "partnership": 0.5, "dividend": 0.45, "optimism": 0.6, "strong": 0.6, "climb": 0.55
}

FIN_LEXICON_NEGATIVE = {
    "drop": -0.6, "fall": -0.6, "plunge": -0.85, "slump": -0.75, "crash": -0.9,
    "loss": -0.7, "miss": -0.65, "bearish": -0.8, "downgrade": -0.75, "underperform": -0.75,
    "warning": -0.65, "decline": -0.55, "recession": -0.85, "inflation": -0.4,
    "selloff": -0.8, "lawsuit": -0.6, "delay": -0.5, "headwind": -0.6, "risk": -0.45,
    "slowdown": -0.65, "weakness": -0.6, "debt": -0.45, "deficit": -0.5, "cut": -0.5
}

def analyze_headline_sentiment(headline: str) -> Dict[str, Any]:
    text = headline.lower()
    words = re.findall(r"\b[a-z0-9-]+\b", text)
    
    score = 0.0
    matched_pos = []
    matched_neg = []

    for word in words:
        if word in FIN_LEXICON_POSITIVE:
            score += FIN_LEXICON_POSITIVE[word]
            matched_pos.append(word)
        elif word in FIN_LEXICON_NEGATIVE:
            score += FIN_LEXICON_NEGATIVE[word]
            matched_neg.append(word)

    # Normalize score between -1.0 and +1.0
    total_matches = len(matched_pos) + len(matched_neg)
    if total_matches > 0:
        normalized = max(-1.0, min(1.0, score / max(1.0, total_matches * 0.7)))
    else:
        normalized = 0.05 # Mild baseline market drift

    label = "Bullish" if normalized > 0.15 else ("Bearish" if normalized < -0.15 else "Neutral")

    return {
        "headline": headline,
        "score": round(normalized, 3),
        "label": label,
        "matchedKeywords": matched_pos + matched_neg
    }

def analyze_sentiment_batch(headlines: List[str], symbol: str = "Market") -> Dict[str, Any]:
    if not headlines:
        return {
            "symbol": symbol,
            "overallScore": 65, # Neutral/mild bullish default
            "rawPolarity": 0.15,
            "sentimentLabel": "Bullish",
            "headlineCount": 0,
            "headlines": []
        }

    scored_items = [analyze_headline_sentiment(h) for h in headlines]
    avg_polarity = sum(item["score"] for item in scored_items) / len(scored_items)

    # Map polarity [-1.0, 1.0] to institutional score [0, 100]
    # -1.0 -> 0, 0.0 -> 50, +1.0 -> 100
    sentiment_score_0_100 = round((avg_polarity + 1.0) * 50)
    sentiment_score_0_100 = max(0, min(100, sentiment_score_0_100))

    if sentiment_score_0_100 >= 65:
        overall_label = "Bullish"
    elif sentiment_score_0_100 <= 40:
        overall_label = "Bearish"
    else:
        overall_label = "Neutral"

    return {
        "symbol": symbol,
        "overallScore": sentiment_score_0_100,
        "rawPolarity": round(avg_polarity, 3),
        "sentimentLabel": overall_label,
        "headlineCount": len(scored_items),
        "headlines": scored_items
    }

intent_classifier = IntentClassifier()
