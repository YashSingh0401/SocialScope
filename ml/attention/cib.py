from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone
import re


class CIBDetector:
    """
    Detects Coordinated Inauthentic Behavior (CIB) and astroturfing campaigns.
    Evaluates temporal synchronization, content duplication, and actor concentration.
    """

    def __init__(self, time_window_seconds: int = 120, text_similarity_threshold: float = 0.75):
        self.time_window_seconds = time_window_seconds
        self.text_similarity_threshold = text_similarity_threshold

    def _tokenize(self, text: str) -> set:
        words = re.findall(r"\b\w{3,}\b", text.lower())
        return set(words)

    def _jaccard(self, set_a: set, set_b: set) -> float:
        if not set_a or not set_b:
            return 0.0
        intersection = len(set_a.intersection(set_b))
        union = len(set_a.union(set_b))
        return intersection / union if union > 0 else 0.0

    def analyze_coordination(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes a set of events for coordinated inauthentic activity.
        Returns coordination score (0.0 - 1.0), reason codes, and flagged actors.
        """
        if len(events) < 3:
            return {
                "coordination_score": 0.0,
                "is_coordinated": False,
                "flagged_actors": [],
                "reasons": []
            }

        reasons = []
        actors = [e.get("actor_ref") or "anon" for e in events]
        unique_actors = set(actors)
        total_events = len(events)

        # 1. Content duplication check across different actors
        token_sets = [self._tokenize(e.get("text", "")) for e in events]
        high_similarity_pairs = 0
        total_pairs = 0
        duplicated_actors = set()

        for i in range(total_events):
            for j in range(i + 1, total_events):
                if actors[i] != actors[j]:  # Only compare between different actors
                    total_pairs += 1
                    sim = self._jaccard(token_sets[i], token_sets[j])
                    if sim >= self.text_similarity_threshold:
                        high_similarity_pairs += 1
                        duplicated_actors.add(actors[i])
                        duplicated_actors.add(actors[j])

        duplication_ratio = (high_similarity_pairs / total_pairs) if total_pairs > 0 else 0.0
        if duplication_ratio >= 0.25 and len(duplicated_actors) >= 2:
            reasons.append(
                f"Content Copypasta: {len(duplicated_actors)} distinct accounts sharing near-identical text."
            )

        # 2. Temporal synchronization check
        # Sort events by timestamp
        parsed_events = []
        for e in events:
            ts = e.get("timestamp")
            if isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except Exception:
                    ts = None
            if ts:
                parsed_events.append((ts, e.get("actor_ref") or "anon"))

        parsed_events.sort(key=lambda x: x[0])
        synchronized_burst_count = 0

        for i in range(len(parsed_events) - 1):
            t1, a1 = parsed_events[i]
            t2, a2 = parsed_events[i + 1]
            if a1 != a2 and abs((t2 - t1).total_seconds()) <= self.time_window_seconds:
                synchronized_burst_count += 1

        sync_ratio = (synchronized_burst_count / max(1, len(parsed_events) - 1))
        if sync_ratio >= 0.5 and len(parsed_events) >= 4:
            reasons.append(
                f"Synchronized Posting: High volume of distinct accounts posting within {self.time_window_seconds}s intervals."
            )

        # Calculate final normalized coordination score
        score = min(1.0, (duplication_ratio * 0.6) + (sync_ratio * 0.4))
        is_coordinated = score >= 0.35 and len(reasons) > 0

        return {
            "coordination_score": round(score, 4),
            "is_coordinated": is_coordinated,
            "flagged_actors": sorted(list(duplicated_actors)),
            "reasons": reasons
        }
