"""Evaluation metrics for multilingual sentiment classification."""
from collections import defaultdict


def evaluate_sentiment_predictions(predictions: list[dict], labels: list[str] = None) -> dict:
    """Calculates macro-F1, per-class precision/recall, and sliced metrics across languages.

    predictions: list of {'expected_sentiment': str, 'predicted_sentiment': str, 'language': str}
    """
    labels = labels or ['negative', 'neutral', 'positive']
    total = len(predictions)
    if total == 0:
        return {'sample_count': 0, 'accuracy': 0.0, 'macro_f1': 0.0}

    correct = sum(1 for p in predictions if p.get('expected_sentiment') == p.get('predicted_sentiment'))
    accuracy = correct / total

    # Per-class metrics
    per_class = {}
    f1_scores = []
    matrix = {true_lbl: {pred_lbl: 0 for pred_lbl in [*labels, 'unavailable']} for true_lbl in labels}

    for lbl in labels:
        tp = sum(1 for p in predictions if p.get('expected_sentiment') == lbl and p.get('predicted_sentiment') == lbl)
        fp = sum(1 for p in predictions if p.get('expected_sentiment') != lbl and p.get('predicted_sentiment') == lbl)
        fn = sum(1 for p in predictions if p.get('expected_sentiment') == lbl and p.get('predicted_sentiment') != lbl)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        f1_scores.append(f1)

        per_class[lbl] = {
            'precision': round(precision, 4),
            'recall': round(recall, 4),
            'f1_score': round(f1, 4),
            'support': sum(1 for p in predictions if p.get('expected_sentiment') == lbl)
        }

        # Fill confusion matrix
        for p in predictions:
            if p.get('expected_sentiment') == lbl:
                pred = p.get('predicted_sentiment')
                if pred not in matrix[lbl]:
                    pred = 'unavailable'
                matrix[lbl][pred] += 1

    macro_f1 = sum(f1_scores) / len(f1_scores) if f1_scores else 0.0

    # Language slice analysis (English vs Hindi slices)
    lang_slices = defaultdict(list)
    for p in predictions:
        lang = p.get('language') or 'und'
        lang_slices[lang].append(p)

    slice_metrics = {}
    for lang, items in lang_slices.items():
        slice_correct = sum(1 for p in items if p.get('expected_sentiment') == p.get('predicted_sentiment'))
        slice_metrics[lang] = {
            'sample_count': len(items),
            'accuracy': round(slice_correct / len(items), 4) if items else 0.0
        }

    return {
        'sample_count': total,
        'accuracy': round(accuracy, 4),
        'macro_f1': round(macro_f1, 4),
        'per_class_metrics': per_class,
        'confusion_matrix': matrix,
        'language_slice_metrics': slice_metrics
    }
