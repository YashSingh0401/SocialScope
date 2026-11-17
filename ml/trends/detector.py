from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import numpy as np


class TrendDetector:
    """
    Temporal trend and spike detection for topic time-series.
    Calculates moving baselines, growth rate, velocity, and spike alerts.
    """

    def __init__(self, spike_growth_threshold: float = 1.5, min_spike_volume: int = 5):
        self.spike_growth_threshold = spike_growth_threshold
        self.min_spike_volume = min_spike_volume

    def compute_trend(
        self,
        history_counts: List[int],
        current_volume: int,
        alpha: float = 0.3
    ) -> Dict[str, Any]:
        """
        Computes trend metrics given a list of past window volumes and current volume.
        Uses Exponentially Weighted Moving Average (EWMA) for the baseline.
        """
        if not history_counts:
            baseline = float(current_volume)
            velocity = 0.0
            growth_rate = 0.0
            z_score = 0.0
        else:
            # Calculate EWMA baseline
            baseline = float(history_counts[0])
            for count in history_counts[1:]:
                baseline = alpha * count + (1 - alpha) * baseline

            prev_volume = history_counts[-1]
            velocity = float(current_volume - prev_volume)
            growth_rate = (current_volume - baseline) / max(1.0, baseline)

            # Calculate standard deviation for Z-score
            std_dev = float(np.std(history_counts))
            if std_dev > 0.01:
                z_score = (current_volume - np.mean(history_counts)) / std_dev
            else:
                z_score = growth_rate

        is_spike = (
            current_volume >= self.min_spike_volume and
            growth_rate >= self.spike_growth_threshold and
            velocity > 0
        )

        return {
            "volume_now": current_volume,
            "volume_baseline": round(baseline, 2),
            "growth_rate": round(growth_rate, 4),
            "velocity": round(velocity, 2),
            "z_score": round(float(z_score), 2),
            "is_spike": bool(is_spike)
        }

    def analyze_topic_timeline(
        self,
        timeline_buckets: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Takes timeline buckets sorted by time: [{'timestamp': dt, 'count': n}, ...]
        Returns enriched buckets with baseline, velocity, and spike status.
        """
        enriched = []
        counts_so_far = []

        for bucket in timeline_buckets:
            count = bucket.get("count", 0)
            metrics = self.compute_trend(counts_so_far, count)
            enriched.append({
                **bucket,
                **metrics
            })
            counts_so_far.append(count)

        return enriched
