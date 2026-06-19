import json
import time
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import ValidationError

from models import (
    Story, StoryCreate, StoryUpdate,
    RatingRequest, PublishResponse
)
import storage

app = FastAPI(title="StoryForge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    storage._load_from_file()


@app.get("/api/stories")
async def get_stories(
    search: Optional[str] = Query(None, description="搜索关键词"),
    published_only: bool = Query(True, description="仅显示已发布")
):
    stories = storage.list_stories(search=search, published_only=published_only)
    return stories


@app.get("/api/stories/{story_id}")
async def get_story(story_id: str):
    story = storage.get_story(story_id)
    if not story:
        raise HTTPException(status_code=404, detail="故事不存在")
    return story


@app.post("/api/stories", response_model=Story, status_code=201)
async def create_story(data: StoryCreate):
    new_story = storage.create_story(data)
    return new_story


@app.put("/api/stories/{story_id}")
async def update_story(story_id: str, data: Story):
    existing = storage.get_story(story_id)
    if not existing:
        raise HTTPException(status_code=404, detail="故事不存在")
    if data.id != story_id:
        raise HTTPException(status_code=400, detail="ID不匹配")
    storage._stories[story_id] = data
    storage._save_to_file()
    return data


@app.patch("/api/stories/{story_id}")
async def patch_story(story_id: str, data: StoryUpdate):
    updated = storage.update_story(story_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="故事不存在")
    return updated


@app.delete("/api/stories/{story_id}", status_code=204)
async def delete_story(story_id: str):
    deleted = storage.delete_story(story_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="故事不存在")
    return None


@app.post("/api/stories/{story_id}/publish")
async def publish_story(story_id: str):
    result = storage.publish_story(story_id)
    if not result:
        raise HTTPException(status_code=404, detail="故事不存在")
    return PublishResponse(**result)


@app.post("/api/stories/{story_id}/play")
async def increment_play(story_id: str):
    count = storage.increment_play(story_id)
    if count is None:
        raise HTTPException(status_code=404, detail="故事不存在")
    return {"playCount": count}


@app.post("/api/stories/{story_id}/rate")
async def rate_story(story_id: str, data: RatingRequest):
    result = storage.rate_story(story_id, data.rating)
    if not result:
        raise HTTPException(status_code=404, detail="故事不存在")
    return result


@app.get("/api/s/{short_id}")
async def get_by_short_url(short_id: str):
    story = storage.get_by_short_id(short_id)
    if not story:
        raise HTTPException(status_code=404, detail="短链接无效")
    return RedirectResponse(url=f"/play/{story.id}", status_code=307)


@app.websocket("/ws/stories/{story_id}")
async def websocket_endpoint(websocket: WebSocket, story_id: str):
    await websocket.accept()
    last_save_ts = 0
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type")

                if msg_type == "heartbeat":
                    await websocket.send_json({
                        "type": "heartbeat",
                        "ts": int(time.time() * 1000)
                    })

                elif msg_type == "save":
                    story_data = message.get("data")
                    ts = message.get("ts", int(time.time() * 1000))
                    try:
                        story = Story(**story_data)
                        existing = storage.get_story(story_id)
                        if existing and ts < last_save_ts:
                            await websocket.send_json({
                                "type": "conflict",
                                "message": "检测到更新冲突，数据已被更新"
                            })
                            continue
                        storage._stories[story_id] = story
                        storage._save_to_file()
                        last_save_ts = ts
                        await websocket.send_json({
                            "type": "saved",
                            "success": True,
                            "ts": int(time.time() * 1000)
                        })
                    except ValidationError as e:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"数据验证失败: {str(e)}"
                        })

                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"未知消息类型: {msg_type}"
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "JSON格式错误"
                })

    except WebSocketDisconnect:
        pass
