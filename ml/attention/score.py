from typing import Dict, Any, List


class AttentionEngine:
    """
    Multi-signal Attention Engine for prioritizing emerging situations.
    Grounded in Section 15 of the SocialScope architectural specification.
    Produces transparent, evidence-backed Attention Scores (0 - 100).
    """

    def __init__(
        self,
        w_growth: float = 0.25,
        w_sentiment: float = 0.20,
        w_network: float = 0.20,
        w_cross_platform: float = 0.15,
        w_anomaly: float = 0.20
    ):
        self.w_growth = w_growth
        self.w_sentiment = w_sentiment
        self.w_network = w_network
        self.w_cross_platform = w_cross_platform
        self.w_anomaly = w_anomaly

    def calculate_attention(
        self,
        growth_rate: float,
        negative_sentiment_ratio: float,
        community_count: int,
        platform_count: int,
        cib_score: float,
        total_volume: int = 1
    ) -> Dict[str, Any]:
        """
        Calculates explainable Attention Score from multi-vector signals.
        All input signals are normalized to [0.0, 1.0].
        """
        # 1. Normalize narrative growth (capped at 3.0 / 300% growth)
        norm_growth = min(1.0, max(0.0, growth_rate / 3.0))

        # 2. Normalize sentiment shift (proportion of intense negative/hostile sentiment)
        norm_sentiment = min(1.0, max(0.0, negative_sentiment_ratio))

        # 3. Normalize network expansion (multi-community involvement, capped at 5 communities)
        norm_network = min(1.0, max(0.0, (community_count - 1) / 4.0)) if community_count > 1 else 0.0

        # 4. Normalize cross-platform spread (single platform = 0.0, 2 = 0.5, 3+ = 1.0)
        norm_platform = min(1.0, max(0.0, (platform_count - 1) / 2.0)) if platform_count > 1 else 0.0

        # 5. CIB / Anomaly score
        norm_anomaly = min(1.0, max(0.0, cib_score))

        # Weighted composite score (0 to 100)
        raw_score = (
            (self.w_growth * norm_growth) +
            (self.w_sentiment * norm_sentiment) +
            (self.w_network * norm_network) +
            (self.w_cross_platform * norm_platform) +
            (self.w_anomaly * norm_anomaly)
        ) * 100.0

        # Apply minor volume damping if total events is very small (< 4 events)
        if total_volume < 4:
            raw_score = raw_score * (total_volume / 4.0)

        attention_score = int(round(min(100.0, max(0.0, raw_score))))

        # Determine severity level
        if attention_score >= 75:
            severity = "CRITICAL"
        elif attention_score >= 55:
            severity = "HIGH"
        elif attention_score >= 35:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # Compile explainable reason codes
        reasons = []
        if norm_growth >= 0.5:
            reasons.append(f"Volume surged by {int(growth_rate * 100)}% over historical baseline.")
        if norm_sentiment >= 0.5:
            reasons.append(f"High negative/adverse sentiment detected ({int(negative_sentiment_ratio * 100)}%).")
        if norm_network >= 0.5:
            reasons.append(f"Narrative breached {community_count} distinct online communities.")
        if norm_platform >= 0.5:
            reasons.append(f"Cross-platform diffusion across {platform_count} different services.")
        if norm_anomaly >= 0.4:
            reasons.append(f"Coordinated Inauthentic Behavior (CIB) detected (Score: {int(cib_score * 100)}%).")

        if not reasons:
            reasons.append("Normal conversation velocity within expected baseline bounds.")

        return {
            "attention_score": attention_score,
            "severity": severity,
            "signals": {
                "growth": round(norm_growth, 3),
                "sentiment_shift": round(norm_sentiment, 3),
                "network_expansion": round(norm_network, 3),
                "cross_platform": round(norm_platform, 3),
                "behavior_anomaly": round(norm_anomaly, 3)
            },
            "reasons": reasons
        }
