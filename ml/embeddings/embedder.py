import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import normalize


class TextEmbedder:
    """
    Lightweight, deterministic text embedder producing L2-normalized dense vectors.
    Provides reliable, zero-network-dependency embeddings for semantic clustering.
    """

    def __init__(self, dimension: int = 64):
        self.dimension = dimension
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            stop_words='english',
            token_pattern=r'(?u)\b\w+\b'
        )
        self.svd = TruncatedSVD(n_components=self.dimension, random_state=42)
        self._is_fitted = False

    def _clean(self, text: str) -> str:
        text = re.sub(r'https?://\S+', ' ', text)
        text = re.sub(r'@\w+', ' ', text)
        text = re.sub(r'#(\w+)', r'\1', text)
        return text.strip().lower()

    def fit_transform(self, texts: list[str]) -> np.ndarray:
        cleaned = [self._clean(t) for t in texts]
        if not cleaned or all(len(t) == 0 for t in cleaned):
            return np.zeros((len(texts), self.dimension), dtype=np.float32)

        tfidf = self.vectorizer.fit_transform(cleaned)
        n_features = tfidf.shape[1]

        if n_features < self.dimension:
            # Pad or use available features directly if vocabulary is small
            dense = tfidf.toarray()
            padded = np.pad(dense, ((0, 0), (0, max(0, self.dimension - n_features))))
            self._is_fitted = True
            return normalize(padded[:, :self.dimension], norm='l2', axis=1).astype(np.float32)

        self.svd.n_components = min(self.dimension, n_features - 1 if n_features > 1 else 1)
        reduced = self.svd.fit_transform(tfidf)
        if reduced.shape[1] < self.dimension:
            reduced = np.pad(reduced, ((0, 0), (0, self.dimension - reduced.shape[1])))
        self._is_fitted = True
        return normalize(reduced, norm='l2', axis=1).astype(np.float32)

    def transform(self, texts: list[str]) -> np.ndarray:
        if not self._is_fitted:
            return self.fit_transform(texts)
        cleaned = [self._clean(t) for t in texts]
        tfidf = self.vectorizer.transform(cleaned)
        try:
            reduced = self.svd.transform(tfidf)
            if reduced.shape[1] < self.dimension:
                reduced = np.pad(reduced, ((0, 0), (0, self.dimension - reduced.shape[1])))
            return normalize(reduced, norm='l2', axis=1).astype(np.float32)
        except Exception:
            return self.fit_transform(texts)
