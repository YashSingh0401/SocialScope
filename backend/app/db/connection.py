"""Short-lived transactional database connections; no credentials in source."""
import os

import psycopg
from psycopg.rows import dict_row


def connect():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not configured")
    return psycopg.connect(url, connect_timeout=5, row_factory=dict_row)
