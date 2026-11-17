import unittest

from fastapi.testclient import TestClient

from backend.app.main import app


class HealthTests(unittest.TestCase):
    def test_api_and_openapi_are_available(self):
        with TestClient(app) as client:
            response = client.get("/health")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["status"], "ok")
            self.assertIn("/health", client.get("/openapi.json").json()["paths"])
            paths = client.get("/openapi.json").json()["paths"]
            self.assertIn("/analytics/topics", paths)
            self.assertIn("/analytics/trends", paths)
            self.assertIn("/analytics/network", paths)
            self.assertIn("/analytics/alerts", paths)
