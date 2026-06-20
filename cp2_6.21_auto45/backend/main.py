from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import os

DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")


def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"shares": {}}


def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class KeyframeProperties(BaseModel):
    transform: str = ""
    opacity: int = 100
    filter: str = ""
    borderRadius: int = 0


class Keyframe(BaseModel):
    id: str
    percent: int
    properties: KeyframeProperties


class ShareRequest(BaseModel):
    hash: str
    keyframes: List[Keyframe]
    createdAt: int


class ShareResponse(BaseModel):
    hash: str
    url: str
    keyframes: List[Keyframe]


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/share", response_model=ShareResponse)
async def create_share(req: ShareRequest):
    data = load_data()
    share_url = f"/share/{req.hash}"
    data["shares"][req.hash] = {
        "hash": req.hash,
        "keyframes": [kf.model_dump() for kf in req.keyframes],
        "createdAt": req.createdAt,
    }
    save_data(data)
    return ShareResponse(
        hash=req.hash,
        url=share_url,
        keyframes=req.keyframes,
    )


@app.get("/share/{hash}", response_model=ShareResponse)
async def get_share(hash: str):
    data = load_data()
    if hash not in data["shares"]:
        raise HTTPException(status_code=404, detail="Share not found")
    share = data["shares"][hash]
    kfs = [Keyframe(**kf) for kf in share["keyframes"]]
    return ShareResponse(
        hash=share["hash"],
        url=f"/share/{share['hash']}",
        keyframes=kfs,
    )
