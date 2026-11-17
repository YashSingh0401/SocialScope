import json
from pathlib import Path
import tempfile
import unittest

from connectors.dataset import load_events


class DatasetTests(unittest.TestCase):
    def test_json_and_csv_equivalence(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d)
            event = dict(platform="dataset",source_id="one",text="Hello",timestamp="2026-11-17T00:00:00Z")
            (p/"data.json").write_text(json.dumps([event]))
            (p/"data.csv").write_text("platform,source_id,text,timestamp\ndataset,one,Hello,2026-11-17T00:00:00Z\n")
            self.assertEqual(load_events(p/"data.json"),load_events(p/"data.csv"))

    def test_empty_and_wrong_json_shape_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d)/"data.json"
            for value in ([],{},[{}]):
                p.write_text(json.dumps(value))
                with self.assertRaises(ValueError): load_events(p)
