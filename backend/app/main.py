"""SocialScope API entry point. Start from the repository root."""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from backend.app.api.routes_analytics import router as analytics_router
from fastapi.responses import JSONResponse
import psycopg

from backend.app.api.routes_events import router
from backend.app.api.routes_replays import router as replay_router
from backend.app.db.connection import connect

app = FastAPI(
    title="SocialScope API",
    version="0.4.0",
    description="Social-media intelligence backend: replay, multilingual enrichment and analytics.",
)
app.include_router(router)
app.include_router(replay_router)
app.include_router(analytics_router)


@app.exception_handler(psycopg.Error)
@app.exception_handler(RuntimeError)
async def database_error(request, exc):
    return JSONResponse(status_code=503, content={"detail": f"Database operation unavailable: {exc}"})


@app.get("/ready", tags=["System"])
def ready():
    try:
        with connect() as conn:
            conn.execute("SELECT event_id FROM events LIMIT 0")
            conn.execute("SELECT replay_id FROM replay_jobs LIMIT 0")
            conn.execute("SELECT event_id FROM event_annotations LIMIT 0")
        return {"status":"ready"}
    except (psycopg.Error, RuntimeError):
        return JSONResponse(status_code=503, content={"status":"not_ready"})


@app.get("/health", tags=["System"])
def health() -> dict[str, str]:
    """Liveness only; this does not claim database readiness."""
    return {"status": "ok", "service": "socialscope-api", "stage": "analytics"}

# Built dashboard shares the API origin; build before starting the application.
frontend_dist=Path(__file__).resolve().parents[2]/"frontend/dist"
if frontend_dist.exists():
    app.mount("/",StaticFiles(directory=frontend_dist,html=True),name="dashboard")
