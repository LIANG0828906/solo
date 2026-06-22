import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import classes, essays, comments, stats
from backend.repositories import json_repository
from backend.utils.mock_data import generate_mock_data


def init_mock_data():
    data = generate_mock_data()
    if not json_repository.get_all("classes.json"):
        json_repository.write_json("classes.json", data["classes"])
    if not json_repository.get_all("essays.json"):
        json_repository.write_json("essays.json", data["essays"])
    if not json_repository.get_all("comments.json"):
        json_repository.write_json("comments.json", data["comments"])
    if not json_repository.get_all("preset_comments.json"):
        json_repository.write_json("preset_comments.json", data["preset_comments"])
    if not json_repository.get_all("scores.json"):
        json_repository.write_json("scores.json", data["scores"])


app = FastAPI(title="作文批改系统 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classes.router)
app.include_router(essays.router)
app.include_router(comments.router)
app.include_router(stats.router)


@app.on_event("startup")
async def startup_event():
    init_mock_data()


@app.get("/api/health")
async def health_check():
    return {"code": 200, "data": {"status": "ok"}, "message": "success"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
