"""Apply ordered SQL migrations once; changed applied migrations are rejected."""
import hashlib
from pathlib import Path

from backend.app.db.connection import connect


def migrate():
    folder = Path(__file__).resolve().parents[1] / "backend/app/db/migrations"
    with connect() as conn:
        conn.execute("SELECT pg_advisory_xact_lock(740021)")
        conn.execute("""CREATE TABLE IF NOT EXISTS schema_migrations (
            name TEXT PRIMARY KEY, checksum TEXT NOT NULL,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT now())""")
        for path in sorted(folder.glob("*.sql")):
            sql = path.read_text()
            checksum = hashlib.sha256(sql.encode()).hexdigest()
            existing = conn.execute("SELECT checksum FROM schema_migrations WHERE name=%s", (path.name,)).fetchone()
            if existing:
                if existing["checksum"] != checksum:
                    raise RuntimeError(f"Applied migration changed: {path.name}")
                continue
            conn.execute(sql)
            conn.execute("INSERT INTO schema_migrations(name,checksum) VALUES (%s,%s)", (path.name, checksum))
    print("Database migrations are up to date.")


if __name__ == "__main__":
    migrate()
