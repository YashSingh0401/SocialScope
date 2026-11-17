import unittest
from ml.language.detector import detect


class LanguageTests(unittest.TestCase):
    def test_insufficient_language_evidence(self):
        for text in ['123456','🎉','http://example.com','@username']:
            with self.subTest(text=text):
                self.assertEqual(detect(text)['language'],'und')

    def test_clear_english_and_hindi(self):
        self.assertEqual(detect('The students are studying in the university library today.')['language'],'en')
        self.assertEqual(detect('यह सेवा बहुत खराब है। मैं बहुत निराश और नाराज़ हूँ।')['language'],'hi')
