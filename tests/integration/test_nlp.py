from unittest.mock import Mock
from tests.integration import test_database
from pipelines.nlp_pipeline import process_next
from backend.app.db.connection import connect
from ml.sentiment.registry import PIPELINE_VERSION


class NLPTests(test_database.DatabaseFixture):
    def test_pending_is_not_neutral(self):
        self.send([self.event()])
        result=self.client.get('/analytics/overview').json()
        self.assertEqual((result['total'],result['analyzed'],result['sentiment_available']),(1,0,0))
        self.assertEqual(result['sentiment'],[{'label':'unavailable','count':1}])

    def test_annotation_persistence_and_idempotency(self):
        self.send([self.event(language='hi')])
        analyzer=Mock()
        analyzer.analyze.return_value={'language':'en','sentiment':'positive','sentiment_status':'predicted','sentiment_score':.9}
        self.assertIsNotNone(process_next(analyzer))
        self.assertIsNone(process_next(analyzer))
        analyzer.analyze.assert_called_once()
        result=self.client.get('/analytics/events?language=en&sentiment=positive').json()['items']
        self.assertEqual(len(result),1)
        self.assertEqual(result[0]['supplied_language'],'hi')
        self.assertEqual(result[0]['analysis']['language'],'en')
        self.assertEqual(self.client.get('/analytics/overview?language=hi').json()['total'],0)
        self.assertEqual(self.client.get('/analytics/overview?language=en').json()['sentiment_available'],1)

    def test_failed_inference_remains_pending(self):
        self.send([self.event()])
        analyzer=Mock();analyzer.analyze.side_effect=RuntimeError('inference failure')
        with self.assertRaises(RuntimeError): process_next(analyzer)
        with connect() as conn:
            self.assertEqual(conn.execute('SELECT count(*) AS n FROM event_annotations').fetchone()['n'],0)

    def test_frontend_and_replay_list(self):
        from backend.app.main import frontend_dist
        if frontend_dist.exists():
            self.assertEqual(self.client.get('/').status_code,200)
            self.assertIn('SocialScope',self.client.get('/').text)
        self.assertEqual(self.client.get('/replays').json(),{'items':[]})

    def test_real_model_database_roundtrip(self):
        from ml.sentiment.registry import MODEL_DIR
        from ml.pipeline import Analyzer
        if not (MODEL_DIR / 'model_quantized.onnx').exists():
            self.skipTest('Download models to run real inference integration')
        self.send([self.event(text='I hate this terrible product. It stopped working immediately.')])
        self.assertIsNotNone(process_next(Analyzer()))
        row=self.client.get('/analytics/events').json()['items'][0]
        self.assertEqual(row['analysis']['language'],'en')
        self.assertEqual(row['analysis']['sentiment'],'negative')
        self.assertEqual(self.client.get('/analytics/overview').json()['analyzed'],1)
