import asyncio
import json
import os
import random
import string
from pathlib import Path
from typing import Dict, List, Optional

import socketio
from aiofiles import open as aio_open
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATA_DIR = Path(__file__).parent / "data"
PROJECTS_FILE = DATA_DIR / "projects.json"

FPS = 20
STEPS_PER_LOOP = 16
FRAMES_PER_LOOP = 320

PITCH_TO_MIDI = {0: 60, 1: 62, 2: 64, 3: 65, 4: 67, 5: 69, 6: 71, 7: 72}


class Note(BaseModel):
    id: str
    step: int
    pitch: int
    velocity: int = 100


class Track(BaseModel):
    id: str
    name: str
    instrument: str = "synth"
    notes: List[Note] = []


class Project(BaseModel):
    id: Optional[str] = None
    name: str = "Untitled"
    invite_code: Optional[str] = None
    tracks: List[Track] = []
    bpm: int = 120
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CreateProjectRequest(BaseModel):
    name: str = "Untitled"


class JoinProjectRequest(BaseModel):
    invite_code: str


class SaveProjectRequest(BaseModel):
    name: Optional[str] = None
    tracks: Optional[List[Track]] = None
    bpm: Optional[int] = None


class RoomState:
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.current_frame: int = 0
        self.is_playing: bool = False
        self.tracks: List[Dict] = []
        self.online_users: Dict[str, str] = {}
        self._play_task: Optional[asyncio.Task] = None


sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["http://localhost:5173"]
)
app = FastAPI(title="Collaborative DAW API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

socket_app = socketio.ASGIApp(sio, app)

rooms: Dict[str, RoomState] = {}
projects_cache: Dict[str, Dict] = {}


def generate_invite_code() -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choice(chars) for _ in range(4))


def generate_id() -> str:
    return "".join(random.choice(string.ascii_lowercase + string.digits) for _ in range(8))


async def load_projects():
    if not PROJECTS_FILE.exists():
        return {}
    async with aio_open(PROJECTS_FILE, "r", encoding="utf-8") as f:
        content = await f.read()
        if not content:
            return {}
        return json.loads(content)


async def save_projects(data: Dict):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    async with aio_open(PROJECTS_FILE, "w", encoding="utf-8") as f:
        await f.write(json.dumps(data, ensure_ascii=False, indent=2))


async def init_cache():
    global projects_cache
    projects_cache = await load_projects()


@app.on_event("startup")
async def startup():
    await init_cache()


@app.post("/api/project/create")
async def create_project(req: CreateProjectRequest):
    project_id = generate_id()
    invite_code = generate_invite_code()
    from datetime import datetime
    now = datetime.utcnow().isoformat()
    project = {
        "id": project_id,
        "name": req.name,
        "invite_code": invite_code,
        "tracks": [],
        "bpm": 120,
        "created_at": now,
        "updated_at": now,
    }
    projects_cache[project_id] = project
    await save_projects(projects_cache)
    rooms[project_id] = RoomState(project_id)
    return project


@app.post("/api/project/join")
async def join_project(req: JoinProjectRequest):
    for pid, proj in projects_cache.items():
        if proj.get("invite_code") == req.invite_code:
            if pid not in rooms:
                rooms[pid] = RoomState(pid)
                rooms[pid].tracks = [dict(t) for t in proj.get("tracks", [])]
            return proj
    raise HTTPException(status_code=404, detail="Invalid invite code")


@app.get("/api/project/{project_id}")
async def get_project(project_id: str):
    proj = projects_cache.get(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj


@app.put("/api/project/{project_id}/save")
async def save_project(project_id: str, req: SaveProjectRequest):
    proj = projects_cache.get(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    from datetime import datetime
    if req.name is not None:
        proj["name"] = req.name
    if req.tracks is not None:
        proj["tracks"] = [t.model_dump() for t in req.tracks]
        if project_id in rooms:
            rooms[project_id].tracks = [t.model_dump() for t in req.tracks]
    if req.bpm is not None:
        proj["bpm"] = req.bpm
    proj["updated_at"] = datetime.utcnow().isoformat()
    projects_cache[project_id] = proj
    await save_projects(projects_cache)
    return proj


@app.get("/api/projects")
async def list_projects():
    return list(projects_cache.values())


def get_active_notes_at_frame(tracks: List[Dict], frame: int) -> List[Dict]:
    step = frame // (FRAMES_PER_LOOP // STEPS_PER_LOOP)
    step = step % STEPS_PER_LOOP
    active = []
    for track in tracks:
        for note in track.get("notes", []):
            if note.get("step") == step:
                pitch = note.get("pitch", 0)
                midi = PITCH_TO_MIDI.get(pitch, 60)
                velocity = note.get("velocity", 100)
                active.append({
                    "note_id": note.get("id"),
                    "track_id": track.get("id"),
                    "midi": midi,
                    "velocity": velocity,
                })
    return active


async def play_loop(room_id: str):
    room = rooms.get(room_id)
    if not room:
        return
    frame_duration = 1.0 / FPS
    while room.is_playing:
        room.current_frame = (room.current_frame + 1) % FRAMES_PER_LOOP
        active_notes = get_active_notes_at_frame(room.tracks, room.current_frame)
        await sio.emit(
            "audio_frame",
            {
                "frame": room.current_frame,
                "notes": active_notes,
            },
            room=room_id,
        )
        await asyncio.sleep(frame_duration)


@sio.event
async def connect(sid, environ):
    pass


@sio.event
async def disconnect(sid):
    for room_id, room in rooms.items():
        if sid in room.online_users:
            del room.online_users[sid]
            await sio.emit(
                "user_left",
                {"sid": sid, "users": list(room.online_users.values())},
                room=room_id,
            )
            break


@sio.event
async def join_room(sid, data):
    project_id = data.get("project_id")
    username = data.get("username", f"user_{sid[:4]}")
    if not project_id:
        return
    if project_id not in rooms:
        proj = projects_cache.get(project_id)
        rooms[project_id] = RoomState(project_id)
        if proj:
            rooms[project_id].tracks = [dict(t) for t in proj.get("tracks", [])]
    room = rooms[project_id]
    await sio.enter_room(sid, project_id)
    room.online_users[sid] = username
    await sio.emit(
        "user_joined",
        {
            "sid": sid,
            "username": username,
            "users": list(room.online_users.values()),
            "tracks": room.tracks,
            "current_frame": room.current_frame,
            "is_playing": room.is_playing,
        },
        room=project_id,
    )


@sio.event
async def add_note(sid, data):
    project_id = data.get("project_id")
    track_id = data.get("track_id")
    note = data.get("note")
    if not project_id or project_id not in rooms:
        return
    room = rooms[project_id]
    for track in room.tracks:
        if track.get("id") == track_id:
            if "notes" not in track:
                track["notes"] = []
            track["notes"].append(note)
            break
    await sio.emit("add_note", {"track_id": track_id, "note": note}, room=project_id, skip_sid=sid)


@sio.event
async def remove_note(sid, data):
    project_id = data.get("project_id")
    track_id = data.get("track_id")
    note_id = data.get("note_id")
    if not project_id or project_id not in rooms:
        return
    room = rooms[project_id]
    for track in room.tracks:
        if track.get("id") == track_id:
            track["notes"] = [n for n in track.get("notes", []) if n.get("id") != note_id]
            break
    await sio.emit("remove_note", {"track_id": track_id, "note_id": note_id}, room=project_id, skip_sid=sid)


@sio.event
async def update_track(sid, data):
    project_id = data.get("project_id")
    track = data.get("track")
    if not project_id or project_id not in rooms:
        return
    room = rooms[project_id]
    track_id = track.get("id")
    found = False
    for i, t in enumerate(room.tracks):
        if t.get("id") == track_id:
            room.tracks[i] = track
            found = True
            break
    if not found:
        room.tracks.append(track)
    await sio.emit("update_track", {"track": track}, room=project_id, skip_sid=sid)


@sio.event
async def add_track(sid, data):
    project_id = data.get("project_id")
    track = data.get("track")
    if not project_id or project_id not in rooms:
        return
    room = rooms[project_id]
    room.tracks.append(track)
    await sio.emit("add_track", {"track": track}, room=project_id, skip_sid=sid)


@sio.event
async def remove_track(sid, data):
    project_id = data.get("project_id")
    track_id = data.get("track_id")
    if not project_id or project_id not in rooms:
        return
    room = rooms[project_id]
    room.tracks = [t for t in room.tracks if t.get("id") != track_id]
    await sio.emit("remove_track", {"track_id": track_id}, room=project_id, skip_sid=sid)


@sio.event
async def play(sid, data):
    project_id = data.get("project_id")
    if not project_id or project_id not in rooms:
        return
    room = rooms[project_id]
    if not room.is_playing:
        room.is_playing = True
        room._play_task = asyncio.create_task(play_loop(project_id))
    await sio.emit("play", {"frame": room.current_frame}, room=project_id)


@sio.event
async def stop(sid, data):
    project_id = data.get("project_id")
    if not project_id or project_id not in rooms:
        return
    room = rooms[project_id]
    room.is_playing = False
    if room._play_task:
        room._play_task.cancel()
        room._play_task = None
    room.current_frame = 0
    await sio.emit("stop", {}, room=project_id)


app = socket_app
