"""Evaluation metrics for time-series anomaly detection and spike alerting."""
import math


def evaluate_trend_detector(timeline_results: list[dict], ground_truth_spikes: list[int] = None) -> dict:
    """Evaluates trend detection performance and false alarm rates.

    timeline_results: output of TrendDetector.analyze_topic_timeline(...)
    ground_truth_spikes: list of indices expected to be spikes
    """
    total_buckets = len(timeline_results)
    if total_buckets == 0:
        return {'status': 'no_timeline_data'}

    predicted_spikes = [i for i, b in enumerate(timeline_results) if b.get('is_spike')]

    # Calculate EWMA baseline reconstruction error (RMSE)
    errors = []
    for b in timeline_results:
        vol = b.get('volume_now', 0)
        base = b.get('volume_baseline')
        if base is not None:
            errors.append((vol - base) ** 2)

    rmse = math.sqrt(sum(errors) / len(errors)) if errors else 0.0

    metrics = {
        'total_periods': total_buckets,
        'flagged_spikes_count': len(predicted_spikes),
        'flagged_indices': predicted_spikes,
        'baseline_rmse': round(rmse, 4)
    }

    if ground_truth_spikes is not None:
        gt_set = set(ground_truth_spikes)
        pred_set = set(predicted_spikes)

        tp = len(gt_set.intersection(pred_set))
        fp = len(pred_set - gt_set)
        fn = len(gt_set - pred_set)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        metrics['spike_precision'] = round(precision, 4)
        metrics['spike_recall'] = round(recall, 4)
        metrics['spike_f1'] = round(f1, 4)

    return metrics
