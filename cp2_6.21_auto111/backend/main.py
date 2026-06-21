from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import socketio
from typing import List, Optional
from pydantic import BaseModel
from database import init_db
import models

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/", socketio.ASGIApp(sio, other_asgi_app=app))

class CreatePollRequest(BaseModel):
    title: str
    description: Optional[str] = None
    options: List[str]
    isMultipleChoice: bool = False

class VoteRequest(BaseModel):
    optionIds: List[int]

@app.on_event("startup")
async def startup_event():
    init_db()

@app.post("/api/polls")
async def create_poll_endpoint(request: CreatePollRequest, x_device_id: str = Header(None)):
    if not x_device_id:
        raise HTTPException(status_code=400, detail="X-Device-Id header is required")
    
    if not request.title or not request.options or len(request.options) < 2:
        raise HTTPException(status_code=400, detail="Title and at least 2 options are required")
    
    poll = models.create_poll(
        title=request.title,
        description=request.description,
        options=request.options,
        creator_device_id=x_device_id,
        is_multiple_choice=request.isMultipleChoice
    )
    return poll

@app.get("/api/polls/{poll_id}")
async def get_poll_endpoint(poll_id: str):
    poll = models.get_poll(poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    return poll

@app.post("/api/polls/{poll_id}/vote")
async def vote_endpoint(poll_id: str, request: VoteRequest, x_device_id: str = Header(None)):
    if not x_device_id:
        raise HTTPException(status_code=400, detail="X-Device-Id header is required")
    
    if not request.optionIds or len(request.optionIds) == 0:
        raise HTTPException(status_code=400, detail="At least one option is required")
    
    if models.has_voted(poll_id, x_device_id):
        raise HTTPException(status_code=400, detail="Already voted")
    
    poll = models.add_vote(poll_id, request.optionIds, x_device_id)
    if not poll:
        raise HTTPException(status_code=400, detail="Vote failed")
    
    await sio.emit("vote_update", poll, room=poll_id)
    return poll

@app.get("/api/polls")
async def get_polls_endpoint(x_device_id: str = Header(None)):
    if not x_device_id:
        raise HTTPException(status_code=400, detail="X-Device-Id header is required")
    
    polls = models.get_polls_by_creator(x_device_id, limit=20)
    return polls

@app.delete("/api/polls/{poll_id}")
async def delete_poll_endpoint(poll_id: str, x_device_id: str = Header(None)):
    if not x_device_id:
        raise HTTPException(status_code=400, detail="X-Device-Id header is required")
    
    success = models.delete_poll(poll_id, x_device_id)
    if not success:
        raise HTTPException(status_code=404, detail="Poll not found or unauthorized")
    
    await sio.emit("poll_deleted", {"pollId": poll_id}, room=poll_id)
    return {"success": True}

@sio.event
async def join_poll(sid, data):
    poll_id = data.get("poll_id")
    if poll_id:
        await sio.enter_room(sid, poll_id)
        poll = models.get_poll(poll_id)
        if poll:
            await sio.emit("poll_data", poll, to=sid)

@sio.event
async def leave_poll(sid, data):
    poll_id = data.get("poll_id")
    if poll_id:
        await sio.leave_room(sid, poll_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
