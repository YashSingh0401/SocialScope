"""Evaluation metrics for semantic topic clustering and cluster separation."""
import numpy as np
from sklearn.metrics import silhouette_score, davies_bouldin_score


def evaluate_topic_clustering(embeddings: np.ndarray, labels: list[int]) -> dict:
    """Calculates clustering quality metrics: Silhouette Score and Davies-Bouldin index."""
    if len(embeddings) < 3:
        return {'status': 'insufficient_samples', 'silhouette_score': None}

    # Filter out noise points (-1) if any
    unique_labels = set(labels) - {-1}
    if len(unique_labels) < 2:
        return {
            'status': 'fewer_than_two_clusters',
            'num_clusters': len(unique_labels),
            'silhouette_score': None,
            'davies_bouldin_score': None
        }

    # Compute silhouette on non-noise vectors
    valid_idx = [i for i, lbl in enumerate(labels) if lbl != -1]
    if len(valid_idx) < 3:
        return {'status': 'insufficient_clustered_samples', 'silhouette_score': None}

    valid_embs = embeddings[valid_idx]
    valid_lbls = [labels[i] for i in valid_idx]

    if len(set(valid_lbls)) < 2:
        return {'status': 'single_cluster_remaining', 'silhouette_score': None}

    sil = silhouette_score(valid_embs, valid_lbls, metric='cosine')
    db = davies_bouldin_score(valid_embs, valid_lbls)

    return {
        'status': 'evaluated',
        'num_clusters': len(unique_labels),
        'total_samples': len(embeddings),
        'clustered_samples': len(valid_idx),
        'noise_samples': len(embeddings) - len(valid_idx),
        'silhouette_score': round(float(sil), 4),
        'davies_bouldin_score': round(float(db), 4)
    }
