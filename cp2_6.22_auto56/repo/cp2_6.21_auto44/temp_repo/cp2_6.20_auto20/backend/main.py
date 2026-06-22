from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Set
from datetime import datetime
import uuid
import asyncio


class VoteOption(BaseModel):
    id: str
    text: str


class Ranking(BaseModel):
    voterId: str
    order: List[str]
    timestamp: float


class Vote(BaseModel):
    id: str
    title: str
    options: List[VoteOption]
    deadline: float
    isClosed: bool = False
    createdAt: float = Field(default_factory=lambda: datetime.now().timestamp())
    rankings: List[Ranking] = []


class CreateVoteRequest(BaseModel):
    title: str
    options: List[str]
    deadline: float


class SubmitRankingRequest(BaseModel):
    voterId: str
    order: List[str]


class OptionScore(BaseModel):
    optionId: str
    text: str
    totalScore: int
    averageRank: float
    voteCount: int


app = FastAPI(title="偏好排序投票 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class VoteStore:
    def __init__(self):
        self.votes: Dict[str, Vote] = {}
        self.connections: Dict[str, Set[WebSocket]] = {}

    def create_vote(self, req: CreateVoteRequest) -> Vote:
        vote_id = str(uuid.uuid4())
        options = [VoteOption(id=str(uuid.uuid4()), text=text) for text in req.options]
        vote = Vote(
            id=vote_id,
            title=req.title,
            options=options,
            deadline=req.deadline,
        )
        self.votes[vote_id] = vote
        self.connections[vote_id] = set()
        return vote

    def get_vote(self, vote_id: str) -> Optional[Vote]:
        return self.votes.get(vote_id)

    def submit_ranking(self, vote_id: str, req: SubmitRankingRequest) -> bool:
        vote = self.votes.get(vote_id)
        if not vote:
            return False

        if vote.isClosed or datetime.now().timestamp() >= vote.deadline:
            vote.isClosed = True
            return False

        option_ids = {opt.id for opt in vote.options}
        if not set(req.order).issubset(option_ids):
            return False
        if len(req.order) != len(vote.options):
            return False

        existing = next((r for r in vote.rankings if r.voterId == req.voterId), None)
        if existing:
            vote.rankings.remove(existing)

        ranking = Ranking(
            voterId=req.voterId,
            order=req.order,
            timestamp=datetime.now().timestamp(),
        )
        vote.rankings.append(ranking)
        return True

    def close_vote(self, vote_id: str) -> bool:
        vote = self.votes.get(vote_id)
        if not vote:
            return False
        vote.isClosed = True
        return True

    def calculate_scores(self, vote_id: str) -> Optional[List[OptionScore]]:
        vote = self.votes.get(vote_id)
        if not vote:
            return None

        n = len(vote.options)
        scores: Dict[str, Dict] = {}
        for opt in vote.options:
            scores[opt.id] = {"total": 0, "rankSum": 0, "count": 0, "text": opt.text}

        for ranking in vote.rankings:
            for pos, option_id in enumerate(ranking.order):
                if option_id in scores:
                    points = n - pos
                    scores[option_id]["total"] += points
                    scores[option_id]["rankSum"] += pos + 1
                    scores[option_id]["count"] += 1

        result = []
        for opt_id, s in scores.items():
            avg_rank = s["rankSum"] / s["count"] if s["count"] > 0 else 0.0
            result.append(
                OptionScore(
                    optionId=opt_id,
                    text=s["text"],
                    totalScore=s["total"],
                    averageRank=avg_rank,
                    voteCount=s["count"],
                )
            )
        return result

    async def broadcast(self, vote_id: str, message: dict):
        if vote_id not in self.connections:
            return
        dead = set()
        for ws in self.connections[vote_id]:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.connections[vote_id].discard(ws)


store = VoteStore()


@app.post("/api/votes")
async def create_vote(req: CreateVoteRequest):
    if not req.title.strip():
        raise HTTPException(status_code=400, detail="投票标题不能为空")
    if len(req.options) < 3:
        raise HTTPException(status_code=400, detail="至少需要3个选项")
    if req.deadline <= datetime.now().timestamp():
        raise HTTPException(status_code=400, detail="截止时间必须在未来")

    vote = store.create_vote(req)
    return {"id": vote.id}


@app.get("/api/votes/{vote_id}")
async def get_vote(vote_id: str):
    vote = store.get_vote(vote_id)
    if not vote:
        raise HTTPException(status_code=404, detail="投票不存在")
    if datetime.now().timestamp() >= vote.deadline:
        vote.isClosed = True
    return vote


@app.post("/api/votes/{vote_id}/rankings")
async def submit_ranking(vote_id: str, req: SubmitRankingRequest):
    if not store.get_vote(vote_id):
        raise HTTPException(status_code=404, detail="投票不存在")

    success = store.submit_ranking(vote_id, req)
    if not success:
        raise HTTPException(status_code=400, detail="提交失败：投票已关闭或排序无效")

    vote = store.get_vote(vote_id)
    await store.broadcast(
        vote_id,
        {"type": "vote_update", "data": vote.model_dump()},
    )
    return {"success": True}


@app.post("/api/votes/{vote_id}/close")
async def close_vote(vote_id: str):
    if not store.get_vote(vote_id):
        raise HTTPException(status_code=404, detail="投票不存在")

    store.close_vote(vote_id)
    vote = store.get_vote(vote_id)
    await store.broadcast(
        vote_id,
        {"type": "vote_update", "data": vote.model_dump()},
    )
    return {"success": True}


@app.get("/api/votes/{vote_id}/results")
async def get_results(vote_id: str):
    scores = store.calculate_scores(vote_id)
    if scores is None:
        raise HTTPException(status_code=404, detail="投票不存在")
    scores.sort(key=lambda x: x.totalScore, reverse=True)
    return scores


@app.websocket("/ws/votes/{vote_id}")
async def websocket_endpoint(websocket: WebSocket, vote_id: str):
    await websocket.accept()

    if vote_id not in store.connections:
        store.connections[vote_id] = set()

    store.connections[vote_id].add(websocket)

    try:
        vote = store.get_vote(vote_id)
        if vote:
            if datetime.now().timestamp() >= vote.deadline:
                vote.isClosed = True
            await websocket.send_json(
                {"type": "vote_update", "data": vote.model_dump()}
            )

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if vote_id in store.connections:
            store.connections[vote_id].discard(websocket)


async def check_deadlines():
    while True:
        now = datetime.now().timestamp()
        for vote_id, vote in store.votes.items():
            if not vote.isClosed and now >= vote.deadline:
                vote.isClosed = True
                await store.broadcast(
                    vote_id,
                    {"type": "vote_update", "data": vote.model_dump()},
                )
        await asyncio.sleep(1)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(check_deadlines())
