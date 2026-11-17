from typing import Dict, Any, List
from datetime import datetime


def assemble_evidence_dossier(
    topic_label: str,
    attention_result: Dict[str, Any],
    cib_result: Dict[str, Any],
    events: List[Dict[str, Any]],
    graph_metrics: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Assembles a comprehensive, explainable evidence dossier for intelligence review.
    Connects narrative origin (Patient Zero), CIB indicators, and key influencers.
    """
    graph_metrics = graph_metrics or {}

    # Sort events by timestamp to identify Patient Zero
    sorted_events = []
    for e in events:
        ts = e.get("timestamp")
        parsed_ts = None
        if isinstance(ts, str):
            try:
                parsed_ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except Exception:
                pass
        sorted_events.append((parsed_ts or datetime.min, e))

    sorted_events.sort(key=lambda x: x[0])

    patient_zero = None
    if sorted_events:
        earliest_e = sorted_events[0][1]
        patient_zero = {
            "event_id": str(earliest_e.get("event_id")),
            "actor_ref": earliest_e.get("actor_ref") or "anonymous",
            "platform": earliest_e.get("platform", "unknown"),
            "timestamp": str(earliest_e.get("timestamp")),
            "text": earliest_e.get("text", "")
        }

    # Extract top amplifiers from graph metrics
    top_influencers = graph_metrics.get("top_influencers", [])[:3]
    bridge_nodes = graph_metrics.get("bridge_nodes", [])[:3]

    # Sample posts representing the cluster
    sample_posts = [
        {
            "event_id": str(e.get("event_id")),
            "actor": e.get("actor_ref", "anon"),
            "platform": e.get("platform", "unknown"),
            "text": e.get("text", "")
        }
        for _, e in sorted_events[:5]
    ]

    return {
        "topic": topic_label,
        "attention_score": attention_result["attention_score"],
        "severity": attention_result["severity"],
        "reasons": attention_result["reasons"],
        "signals": attention_result["signals"],
        "patient_zero": patient_zero,
        "cib_evidence": {
            "is_coordinated": cib_result.get("is_coordinated", False),
            "coordination_score": cib_result.get("coordination_score", 0.0),
            "flagged_accounts": cib_result.get("flagged_actors", []),
            "cib_reasons": cib_result.get("reasons", [])
        },
        "top_influencers": top_influencers,
        "bridge_nodes": bridge_nodes,
        "evidence_samples": sample_posts,
        "status": "pending_review"
    }
