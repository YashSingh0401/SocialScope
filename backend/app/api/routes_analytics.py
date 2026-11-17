from fastapi import APIRouter, Query
from backend.app.db.connection import connect
from ml.sentiment.registry import PIPELINE_VERSION

router=APIRouter(prefix='/analytics',tags=['Analytics'])


def filters(platform,language,sentiment):
    parts=[]; params=[]
    for expr,value in [('e.platform',platform),("a.result->>'language'",language),("a.result->>'sentiment'",sentiment)]:
        if value:
            parts.append(expr+'=%s');params.append(value)
    return (' WHERE '+' AND '.join(parts) if parts else ''),params


@router.get('/overview')
def overview(platform: str | None=None,language: str | None=None,sentiment: str | None=None):
    where,params=filters(platform,language,sentiment)
    join=' FROM events e LEFT JOIN event_annotations a ON a.event_id=e.event_id AND a.pipeline_version=%s'
    args=[PIPELINE_VERSION,*params]
    with connect() as conn:
        counts=conn.execute('''SELECT count(*) AS total,count(a.event_id) AS analyzed,
            count(*) FILTER (WHERE a.result->>'sentiment_status'='predicted') AS sentiment_available'''+join+where,args).fetchone()
        sentiment_rows=conn.execute("SELECT coalesce(a.result->>'sentiment','unavailable') AS label,count(*) AS count"+join+where+' GROUP BY 1 ORDER BY 1',args).fetchall()
        languages=conn.execute("SELECT coalesce(a.result->>'language','pending') AS label,count(*) AS count"+join+where+' GROUP BY 1 ORDER BY 2 DESC',args).fetchall()
        timeline=conn.execute("SELECT date_trunc('day',e.timestamp AT TIME ZONE 'UTC') AS day,count(*) AS count"+join+where+' GROUP BY 1 ORDER BY 1',args).fetchall()
    return {**counts,'sentiment':sentiment_rows,'languages':languages,'timeline':timeline,'pipeline_version':PIPELINE_VERSION}


@router.get('/events')
def events(platform: str | None=None,language: str | None=None,sentiment: str | None=None,
           limit: int=Query(50,ge=1,le=200),offset: int=Query(0,ge=0)):
    where,params=filters(platform,language,sentiment)
    with connect() as conn:
        rows=conn.execute('''SELECT e.event_id,e.platform,e.timestamp,e.text,e.language AS supplied_language,a.result AS analysis
            FROM events e LEFT JOIN event_annotations a ON a.event_id=e.event_id AND a.pipeline_version=%s'''+where+
            ' ORDER BY e.timestamp DESC,e.event_id LIMIT %s OFFSET %s',[PIPELINE_VERSION,*params,limit,offset]).fetchall()
    return {'items':rows,'limit':limit,'offset':offset}
