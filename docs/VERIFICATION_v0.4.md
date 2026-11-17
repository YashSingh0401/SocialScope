# v0.4 verification — 2026-11-17

- 25 Python tests passed, including real ONNX inference through PostgreSQL and the analytics API.
- Frontend production build passed.
- Managed cloud preview verified in a browser with the real backend connected.
- Loaded five labelled synthetic posts through the dashboard: all five annotated;
  English 3, Hindi 2; positive 2, negative 2, neutral 1; pending 0.
- Event explorer rendered imported posts and overview refreshed after enrichment.
- This development preview is temporary, not a permanent public deployment.

The 12-example synthetic evaluation is a smoke check, not a general accuracy benchmark.
