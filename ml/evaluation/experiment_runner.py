"""Comprehensive ML evaluation and benchmarking experiment runner."""
import json
import time
from pathlib import Path
from statistics import mean

from ml.pipeline import Analyzer
from ml.embeddings.embedder import TextEmbedder
from ml.topics.clustering import TopicClusterer
from ml.trends.detector import TrendDetector
from ml.evaluation.sentiment_metrics import evaluate_sentiment_predictions
from ml.evaluation.topic_metrics import evaluate_topic_clustering
from ml.evaluation.trend_metrics import evaluate_trend_detector


def run_full_evaluation():
    """Runs all ML benchmark experiments and writes forensic report."""
    root = Path(__file__).resolve().parents[2]
    experiments_dir = root / 'docs/experiments'
    experiments_dir.mkdir(parents=True, exist_ok=True)

    print("=================================================================")
    print("      SOCIALSCOPE AI/ML FORENSIC BENCHMARK & EVALUATION         ")
    print("=================================================================")

    # 1. Sentiment & Language Benchmark
    samples_path = root / 'data/samples/nlp_synthetic_checks.json'
    samples = json.loads(samples_path.read_text(encoding='utf-8'))
    analyzer = Analyzer()

    sent_preds = []
    latencies = []
    ner_extractions = []
    emotion_extractions = []

    for row in samples:
        t0 = time.perf_counter()
        res = analyzer.analyze(row['text'])
        latencies.append((time.perf_counter() - t0) * 1000)

        sent_preds.append({
            'expected_sentiment': row['sentiment'],
            'predicted_sentiment': res['sentiment'],
            'expected_language': row['language'],
            'predicted_language': res['language'],
            'language': row['language'],
            'text': row['text']
        })
        if res.get('entities'):
            ner_extractions.extend(res['entities'])
        emotion_extractions.append(res['emotion'])

    sent_eval = evaluate_sentiment_predictions(sent_preds)
    lang_acc = sum(1 for p in sent_preds if p['expected_language'] == p['predicted_language']) / len(sent_preds)

    # 2. Topic Clustering Benchmark
    embedder = TextEmbedder()
    test_texts = [s['text'] for s in samples]
    embeddings = embedder.fit_transform(test_texts)
    clusterer = TopicClusterer(min_samples=2, distance_threshold=0.95)
    cluster_res = clusterer.cluster_events([{'event_id': f'e_{i}', 'text': t} for i, t in enumerate(test_texts)])

    # Map cluster assignments to label list
    lbl_list = [-1] * len(test_texts)
    for cid, c_info in cluster_res['clusters'].items():
        for e in cluster_res['cluster_events'][cid]:
            idx = int(e['event_id'].split('_')[1])
            lbl_list[idx] = cid

    topic_eval = evaluate_topic_clustering(embeddings, lbl_list)

    # 3. Trend Spike Detection Benchmark
    trend_det = TrendDetector(spike_growth_threshold=1.5, min_spike_volume=3)
    synthetic_timeline = [
        {'day': '2026-03-01', 'count': 10},
        {'day': '2026-03-02', 'count': 12},
        {'day': '2026-03-03', 'count': 11},
        {'day': '2026-03-04', 'count': 45},  # Spike at index 3
        {'day': '2026-03-05', 'count': 48},  # Sustained spike at index 4
        {'day': '2026-03-06', 'count': 14}
    ]
    trend_res = trend_det.analyze_topic_timeline(synthetic_timeline)
    trend_eval = evaluate_trend_detector(trend_res, ground_truth_spikes=[3, 4])

    report = {
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'nlp_evaluation': {
            'total_samples': len(samples),
            'language_accuracy': round(lang_acc, 4),
            'sentiment_accuracy': sent_eval['accuracy'],
            'sentiment_macro_f1': sent_eval['macro_f1'],
            'language_slices': sent_eval['language_slice_metrics'],
            'confusion_matrix': sent_eval['confusion_matrix'],
            'mean_latency_ms': round(mean(latencies[1:]), 2),
            'p95_latency_ms': round(sorted(latencies)[int(len(latencies) * 0.95)], 2),
            'total_entities_extracted': len(ner_extractions),
            'emotion_distribution': {e: emotion_extractions.count(e) for e in set(emotion_extractions)}
        },
        'topic_clustering_evaluation': topic_eval,
        'trend_detection_evaluation': trend_eval,
        'governance': {
            'hardware': 'CPU Local Execution',
            'quantization': 'ONNX INT8 dynamic',
            'explainability': 'Probabilistic model output; strict attribution rules enforced'
        }
    }

    # Save to docs/experiments
    out_file = experiments_dir / 'ml_comprehensive_evaluation.json'
    out_file.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print(f"\n[OK] Language ID Accuracy: {lang_acc * 100:.1f}%")
    print(f"[OK] Sentiment Accuracy:   {sent_eval['accuracy'] * 100:.1f}%")
    print(f"[OK] Sentiment Macro F1:   {sent_eval['macro_f1']:.4f}")
    print(f"[OK] Mean Inference Speed: {report['nlp_evaluation']['mean_latency_ms']} ms/post")
    print(f"[OK] Trend Spike Recall:   {trend_eval.get('spike_recall', 0) * 100:.1f}%")
    print(f"[OK] Evaluation artifact written to: {out_file}\n")
    return report


if __name__ == '__main__':
    run_full_evaluation()
