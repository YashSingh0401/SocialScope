"""SocialScope API entry point. Start from the repository root."""

from fastapi import FastAPI
from fastapi.responses import JSONResponse
import psycopg

from backend.app.api.routes_events import router
from backend.app.api.routes_replays import router as replay_router
from backend.app.db.connection import connect

app = FastAPI(
    title="SocialScope API",
    version="0.3.0",
    description="Social-media intelligence backend: durable historical replay.",
)
app.include_router(router)
app.include_router(replay_router)


@app.exception_handler(psycopg.Error)
async def database_error(request, exc):
    return JSONResponse(status_code=503, content={"detail":"Database operation unavailable"})


@app.get("/ready", tags=["System"])
def ready():
    try:
        with connect() as conn:
            conn.execute("SELECT event_id FROM events LIMIT 0")
            conn.execute("SELECT replay_id FROM replay_jobs LIMIT 0")
        return {"status":"ready"}
    except (psycopg.Error, RuntimeError):
        return JSONResponse(status_code=503, content={"status":"not_ready"})


@app.get("/health", tags=["System"])
def health() -> dict[str, str]:
    """Liveness only; this does not claim database readiness."""
    return {"status": "ok", "service": "socialscope-api", "stage": "replay"}
