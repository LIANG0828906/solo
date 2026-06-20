import uuid
import datetime
from typing import Dict, List, Any, Optional

import numpy as np
import socketio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import VoteCreate, WeightSubmission

sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")
fastapi_app = FastAPI()

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

votes: Dict[str, Dict[str, Any]] = {}


def calculate_ranking(vote_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    options = vote_data.get("options", [])
    submissions = vote_data.get("submissions", [])

    option_scores: Dict[str, List[int]] = {}
    for opt in options:
        option_scores[opt["id"]] = []

    for sub in submissions:
        weights = sub.get("weights", {})
        for opt_id, score in weights.items():
            if opt_id in option_scores:
                option_scores[opt_id].append(int(score))

    rankings = []
    for opt in options:
        opt_id = opt["id"]
        scores = option_scores[opt_id]
        count = len(scores)

        if count > 0:
            total_score = float(sum(scores))
            average_score = total_score / count
            arr = np.array(scores, dtype=float)
            dist = {
                "min": float(np.min(arr)),
                "max": float(np.max(arr)),
                "median": float(np.median(arr)),
                "q1": float(np.percentile(arr, 25)),
                "q3": float(np.percentile(arr, 75)),
                "values": scores,
            }
        else:
            total_score = 0.0
            average_score = 0.0
            dist = {"min": 0.0, "max": 0.0, "median": 0.0, "q1": 0.0, "q3": 0.0, "values": []}

        rankings.append(
            {
                "optionId": opt_id,
                "name": opt["name"],
                "totalScore": total_score,
                "averageScore": average_score,
                "count": count,
                "distribution": dist,
            }
        )

    rankings.sort(key=lambda x: x["totalScore"], reverse=True)
    for idx, r in enumerate(rankings):
        r["rank"] = idx + 1

    return rankings


def build_summary_payload(vote_data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "voteId": vote_data["id"],
        "title": vote_data["title"],
        "description": vote_data["description"],
        "options": vote_data["options"],
        "submissions": vote_data["submissions"],
        "updatedAt": vote_data["updatedAt"],
        "rankings": calculate_ranking(vote_data),
    }


@fastapi_app.post("/api/votes")
def create_vote(payload: VoteCreate):
    vote_id = str(uuid.uuid4())
    options = []
    for idx, opt in enumerate(payload.options):
        opt_id = str(uuid.uuid4())
        options.append(
            {
                "id": opt_id,
                "name": opt.name,
                "description": opt.description,
                "order": opt.order if opt.order != 0 else idx,
            }
        )
    now = datetime.datetime.utcnow().isoformat()
    vote_data = {
        "id": vote_id,
        "title": payload.title,
        "description": payload.description,
        "options": options,
        "submissions": [],
        "updatedAt": now,
    }
    votes[vote_id] = vote_data
    return {"voteId": vote_id, **vote_data}


@fastapi_app.get("/api/votes/{vote_id}")
def get_vote(vote_id: str):
    vote_data = votes.get(vote_id)
    if not vote_data:
        raise HTTPException(status_code=404, detail="Vote not found")
    return {
        "voteId": vote_id,
        **vote_data,
        "rankings": calculate_ranking(vote_data),
    }


@sio.event
async def connect(sid, environ):
    pass


@sio.event
async def disconnect(sid):
    pass


@sio.event
async def join_vote(sid, data):
    vote_id = data.get("voteId") if isinstance(data, dict) else None
    if not vote_id or vote_id not in votes:
        await sio.emit("error", {"message": "Invalid voteId"}, to=sid)
        return
    await sio.enter_room(sid, vote_id)
    payload = build_summary_payload(votes[vote_id])
    await sio.emit("vote_state", payload, to=sid)


@sio.event
async def submit_weights(sid, data):
    try:
        submission = WeightSubmission(**data)
    except Exception as e:
        await sio.emit("error", {"message": f"Invalid payload: {e}"}, to=sid)
        return

    vote_data = votes.get(submission.voteId)
    if not vote_data:
        await sio.emit("error", {"message": "Vote not found"}, to=sid)
        return

    valid_option_ids = {opt["id"] for opt in vote_data["options"]}
    for opt_id in submission.weights.keys():
        if opt_id not in valid_option_ids:
            await sio.emit("error", {"message": f"Invalid optionId: {opt_id}"}, to=sid)
            return

    existing_idx = None
    for idx, sub in enumerate(vote_data["submissions"]):
        if sub.get("voterId") == submission.voterId:
            existing_idx = idx
            break

    new_sub = {"voterId": submission.voterId, "weights": submission.weights}
    if existing_idx is not None:
        vote_data["submissions"][existing_idx] = new_sub
    else:
        vote_data["submissions"].append(new_sub)

    vote_data["updatedAt"] = datetime.datetime.utcnow().isoformat()

    rankings = calculate_ranking(vote_data)
    await sio.emit(
        "ranking_update",
        {
            "voteId": submission.voteId,
            "rankings": rankings,
            "updatedAt": vote_data["updatedAt"],
        },
        room=submission.voteId,
    )


app = socketio.ASGIApp(sio, other_app=fastapi_app)
