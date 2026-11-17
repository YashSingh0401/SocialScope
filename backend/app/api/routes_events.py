from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from backend.app.schemas.event import CanonicalEvent
from backend.app.services.events import import_events, query_events

router = APIRouter(prefix="/events", tags=["Events"])


class ImportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    dataset_name: str = Field(min_length=1, max_length=200)
    events: list[CanonicalEvent] = Field(min_length=1, max_length=1000)


@router.post("/import")
def import_batch(request: ImportRequest):
    return import_events(request.events, request.dataset_name)


@router.get("/query")
def events(platform: str | None = None, language: str | None = None,
           since: datetime | None = None, until: datetime | None = None,
           limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0)):
    for value in (since, until):
        if value is not None and (value.tzinfo is None or value.utcoffset() is None):
            raise HTTPException(422, "Time filters must include a timezone")
    if since and until and since >= until:
        raise HTTPException(422, "since must precede until")
    return {"items":query_events(platform,language,since,until,limit,offset),
            "limit":limit,"offset":offset}
