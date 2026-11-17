import unittest
from ml.ner.extractor import EntityExtractor


class NERTests(unittest.TestCase):
    def setUp(self):
        self.extractor = EntityExtractor()

    def test_extracts_handles_and_hashtags(self):
        text = "Emergency alert from @official_ops regarding #Blackout in Sector 4."
        entities = self.extractor.extract_entities(text)
        labels = {e['label'] for e in entities}
        self.assertIn('PERSON', labels)
        self.assertIn('HASHTAG', labels)
        self.assertIn('SECURITY_THREAT', labels)

    def test_extracts_bilingual_threat_terms(self):
        text_hi = "पावर ग्रिड पर बड़ा साइबर हमला हुआ है।"
        entities_hi = self.extractor.extract_entities(text_hi)
        labels_hi = [e['label'] for e in entities_hi]
        self.assertIn('INFRASTRUCTURE', labels_hi)
        self.assertIn('SECURITY_THREAT', labels_hi)

    def test_handles_empty_and_noise_text(self):
        self.assertEqual(self.extractor.extract_entities(""), [])
        self.assertEqual(self.extractor.extract_entities(None), [])
        self.assertEqual(self.extractor.extract_entities("Just a normal day."), [])


if __name__ == '__main__':
    unittest.main()
