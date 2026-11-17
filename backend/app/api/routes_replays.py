from uuid import UUID
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import Field

from backend.app.api.routes_events import ImportRequest
from backend.app.services.replay import (create_replay, get_replay, control_replay,
                                         ReplayNotFound, ReplayStateError)

router = APIRouter(prefix='/replays',tags=['Replay'])


class ReplayRequest(ImportRequest):
    speed: float = Field(default=1,gt=0,le=1000000,allow_inf_nan=False)
    immediate: bool = False


@router.post('',status_code=201)
def create(request: ReplayRequest):
    return create_replay(request)


@router.get('/{replay_id}')
def status(replay_id: UUID):
    try:
        return get_replay(replay_id)
    except ReplayNotFound:
        raise HTTPException(404,'Replay not found')


@router.post('/{replay_id}/{action}')
def control(replay_id: UUID,action: Literal['pause','resume','cancel']):
    try:
        return control_replay(replay_id,action)
    except ReplayNotFound:
        raise HTTPException(404,'Replay not found')
    except ReplayStateError as exc:
        raise HTTPException(409,str(exc))


@router.get('')
def list_replays():
    from backend.app.db.connection import connect
    with connect() as conn:
        return {'items':conn.execute('SELECT * FROM replay_jobs ORDER BY created_at DESC LIMIT 100').fetchall()}
