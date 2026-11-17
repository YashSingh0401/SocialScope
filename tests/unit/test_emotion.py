import unittest
from ml.emotion.predictor import EmotionPredictor


class EmotionTests(unittest.TestCase):
    def setUp(self):
        self.predictor = EmotionPredictor()

    def test_predicts_anger_and_oppose_stance(self):
        text = "I hate this corrupt scandal! Boycott this terrible liar!"
        res = self.predictor.predict(text, sentiment='negative')
        self.assertEqual(res['top_emotion'], 'anger')
        self.assertEqual(res['stance'], 'oppose')
        self.assertTrue(res['is_contagion_risk'])

    def test_predicts_joy_and_support_stance(self):
        text = "Huge victory! Congratulations to the entire team on this wonderful success!"
        res = self.predictor.predict(text, sentiment='positive')
        self.assertEqual(res['top_emotion'], 'joy')
        self.assertEqual(res['stance'], 'support')
        self.assertFalse(res['is_contagion_risk'])

    def test_hindi_emotion_prediction(self):
        text_hi = "मुझे बहुत खुशी और गर्व है इस बड़ी जीत पर।"
        res_hi = self.predictor.predict(text_hi, sentiment='positive')
        self.assertEqual(res_hi['top_emotion'], 'joy')
        self.assertEqual(res_hi['stance'], 'support')

    def test_neutral_reportage(self):
        text = "The committee convened at nine o'clock in the regional hall."
        res = self.predictor.predict(text, sentiment='neutral')
        self.assertEqual(res['top_emotion'], 'neutral')
        self.assertEqual(res['stance'], 'neutral')


if __name__ == '__main__':
    unittest.main()
