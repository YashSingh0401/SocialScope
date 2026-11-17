import unittest
import numpy as np
from ml.embeddings.embedder import TextEmbedder


class EmbedderTests(unittest.TestCase):
    def setUp(self):
        self.embedder = TextEmbedder(dimension=32)

    def test_generates_normalized_vectors(self):
        texts = [
            "Heavy traffic reported on the main expressway due to protests.",
            "Demonstrators gather near city hall demanding policy reform.",
            "Traffic jams continue across all major highway corridors."
        ]
        vectors = self.embedder.fit_transform(texts)
        self.assertEqual(vectors.shape, (3, 32))

        # Check L2 norm is ~1.0 for each vector
        norms = np.linalg.norm(vectors, axis=1)
        for norm in norms:
            self.assertAlmostEqual(norm, 1.0, places=3)

    def test_handles_empty_and_noise_inputs(self):
        texts = ["", "   ", "http://example.com @user"]
        vectors = self.embedder.fit_transform(texts)
        self.assertEqual(vectors.shape, (3, 32))

    def test_transform_matches_fit_transform_shape(self):
        train = ["News updates on emergency response", "Medical teams deployed to disaster site"]
        test = ["New emergency alerts issued for flood areas"]
        self.embedder.fit_transform(train)
        test_vectors = self.embedder.transform(test)
        self.assertEqual(test_vectors.shape, (1, 32))


if __name__ == "__main__":
    unittest.main()
