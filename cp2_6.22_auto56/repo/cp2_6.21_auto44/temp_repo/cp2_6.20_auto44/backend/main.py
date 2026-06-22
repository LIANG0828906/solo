from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .services.idea_service import idea_service
from .services.websocket_manager import manager


app = FastAPI(title='Brainstorm API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


class JoinRoomRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)


class CreateIdeaRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = ''
    tags: Optional[List[str]] = []


class VoteRequest(BaseModel):
    type: str = Field(..., pattern='^(agree|disagree|neutral)$')


@app.get('/')
async def root():
    return {'status': 'ok', 'service': 'brainstorm-api'}


@app.post('/api/rooms/{room_id}/join')
async def join_room(room_id: str, req: JoinRoomRequest):
    user = idea_service.join_room(room_id, req.name)
    await manager.broadcast(room_id, {'type': 'user_joined', 'user': user.to_dict()})
    return user.to_dict()


@app.get('/api/rooms/{room_id}/users')
async def get_users(room_id: str):
    users = idea_service.get_users(room_id)
    return [u.to_dict() for u in users]


@app.get('/api/rooms/{room_id}/ideas')
async def get_ideas(room_id: str):
    ideas = idea_service.get_ideas(room_id)
    return [i.to_dict() for i in ideas]


@app.post('/api/rooms/{room_id}/ideas')
async def create_idea(
    room_id: str,
    req: CreateIdeaRequest,
    user_id: Optional[str] = Query(None),
    user_name: Optional[str] = Query(None),
):
    users = idea_service.get_users(room_id)
    author = None
    if user_id:
        for u in users:
            if u.id == user_id:
                author = u
                break
    if not author:
        if user_name:
            author = idea_service.join_room(room_id, user_name)
        else:
            author = users[0] if users else idea_service.join_room(room_id, '匿名用户')

    idea = idea_service.create_idea(
        room_id,
        req.title,
        req.description or '',
        req.tags or [],
        author,
    )
    await manager.broadcast(room_id, {'type': 'idea_created', 'idea': idea.to_dict()})
    return idea.to_dict()


@app.post('/api/rooms/{room_id}/ideas/{idea_id}/vote')
async def vote_idea(room_id: str, idea_id: str, req: VoteRequest):
    idea = idea_service.vote_idea(room_id, idea_id, req.type)
    if not idea:
        raise HTTPException(status_code=404, detail='Idea not found')
    await manager.broadcast(
        room_id,
        {
            'type': 'vote',
            'ideaId': idea.id,
            'voteType': req.type,
            'votes': idea.votes,
        },
    )
    return {'status': 'ok', 'votes': idea.votes}


@app.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket, room_id: str = Query(...)):
    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            pass
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
