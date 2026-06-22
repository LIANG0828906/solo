import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Team Wiki API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USER_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
]


class VoteCounts(BaseModel):
    happy: int = 0
    sad: int = 0
    surprised: int = 0


class Block(BaseModel):
    id: str
    type: str
    content: str
    language: Optional[str] = None
    votes: VoteCounts
    createdAt: float
    updatedAt: float


class Connection(BaseModel):
    id: str
    fromBlockId: str
    toBlockId: str
    createdAt: float


class WikiPage(BaseModel):
    id: str
    title: str
    blocks: List[Block]
    connections: List[Connection]
    createdAt: float
    updatedAt: float


class VersionHistory(BaseModel):
    id: str
    pageId: str
    version: int
    author: str
    authorInitials: str
    timestamp: float
    summary: str
    snapshot: WikiPage


class CursorPosition(BaseModel):
    userId: str
    userName: str
    userInitials: str
    color: str
    blockId: str
    offset: int
    x: float
    y: float


class UserInfo(BaseModel):
    userId: str
    userName: str
    color: str
    userInitials: str


pages: Dict[str, WikiPage] = {}
versions: Dict[str, List[VersionHistory]] = {}
active_connections: Dict[str, List[WebSocket]] = {}
online_users: Dict[str, Dict[str, UserInfo]] = {}


def generate_demo_page(page_id: str) -> WikiPage:
    now = datetime.now().timestamp()
    return WikiPage(
        id=page_id,
        title="团队知识管理最佳实践",
        blocks=[
            Block(
                id=str(uuid.uuid4()),
                type="text",
                content="# 团队知识管理最佳实践\n\n本文档旨在分享团队在知识沉淀、协同编辑方面的经验和方法论。",
                votes=VoteCounts(happy=3, sad=0, surprised=1),
                createdAt=now - 3600,
                updatedAt=now - 1800,
            ),
            Block(
                id=str(uuid.uuid4()),
                type="text",
                content="## 一、为什么需要知识管理\n\n在快速发展的技术团队中，知识的有效沉淀和传递直接影响团队的整体效率和新人的成长速度。",
                votes=VoteCounts(happy=5, sad=0, surprised=0),
                createdAt=now - 3000,
                updatedAt=now - 1200,
            ),
            Block(
                id=str(uuid.uuid4()),
                type="code",
                content="// 示例：团队规范的代码注释\n/**\n * 计算两个日期之间的天数差\n * @param date1 - 开始日期\n * @param date2 - 结束日期\n * @returns 天数差\n */\nfunction daysBetween(date1, date2) {\n  const oneDay = 24 * 60 * 60 * 1000;\n  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));\n}",
                language="typescript",
                votes=VoteCounts(happy=8, sad=0, surprised=2),
                createdAt=now - 2400,
                updatedAt=now - 600,
            ),
            Block(
                id=str(uuid.uuid4()),
                type="text",
                content="## 二、核心原则\n\n### 2.1 结构化优先\n\n所有知识文档都应该有清晰的结构，使用标题层级来组织内容。\n\n### 2.2 关联胜于独立\n\n知识点之间应该建立关联，形成知识网络，而不是孤立的文档。",
                votes=VoteCounts(happy=4, sad=1, surprised=0),
                createdAt=now - 1800,
                updatedAt=now - 300,
            ),
            Block(
                id=str(uuid.uuid4()),
                type="image",
                content="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop",
                votes=VoteCounts(happy=2, sad=0, surprised=0),
                createdAt=now - 1200,
                updatedAt=now - 1200,
            ),
            Block(
                id=str(uuid.uuid4()),
                type="text",
                content="## 三、工具与流程\n\n选择合适的工具是知识管理成功的关键。本Wiki编辑器提供了块级编辑、实时协同、版本历史等核心功能。",
                votes=VoteCounts(happy=6, sad=0, surprised=1),
                createdAt=now - 600,
                updatedAt=now - 60,
            ),
        ],
        connections=[],
        createdAt=now - 7200,
        updatedAt=now,
    )


def create_initial_versions(page: WikiPage) -> List[VersionHistory]:
    now = datetime.now().timestamp()
    return [
        VersionHistory(
            id=str(uuid.uuid4()),
            pageId=page.id,
            version=3,
            author="李四",
            authorInitials="LS",
            timestamp=now - 300,
            summary="添加了工具与流程章节，补充了代码示例",
            snapshot=page,
        ),
        VersionHistory(
            id=str(uuid.uuid4()),
            pageId=page.id,
            version=2,
            author="张三",
            authorInitials="ZS",
            timestamp=now - 1800,
            summary="完善了核心原则章节，增加了二级标题",
            snapshot=WikiPage(**{**page.dict(), "blocks": page.blocks[:4]}),
        ),
        VersionHistory(
            id=str(uuid.uuid4()),
            pageId=page.id,
            version=1,
            author="王五",
            authorInitials="WW",
            timestamp=now - 3600,
            summary="创建文档，编写引言和背景介绍",
            snapshot=WikiPage(**{**page.dict(), "blocks": page.blocks[:2]}),
        ),
    ]


def get_or_create_page(page_id: str) -> WikiPage:
    if page_id not in pages:
        pages[page_id] = generate_demo_page(page_id)
        versions[page_id] = create_initial_versions(pages[page_id])
    return pages[page_id]


def get_user_initials(name: str) -> str:
    parts = name.split()
    return "".join([p[0] for p in parts]).upper()[:2]


def transform_operation(doc: str, op: Dict[str, Any]) -> str:
    if op["type"] == "insert":
        pos = op["position"]
        return doc[:pos] + op["text"] + doc[pos:]
    elif op["type"] == "delete":
        pos = op["position"]
        length = op["length"]
        return doc[:pos] + doc[pos + length:]
    return doc


@app.get("/api/pages/{page_id}")
async def get_page(page_id: str):
    page = get_or_create_page(page_id)
    return page


@app.get("/api/pages/{page_id}/versions")
async def get_versions(page_id: str):
    get_or_create_page(page_id)
    return versions.get(page_id, [])


@app.post("/api/pages/{page_id}/versions/{version_id}/rollback")
async def rollback_version(page_id: str, version_id: str):
    if page_id not in versions:
        raise HTTPException(status_code=404, detail="Page not found")
    
    version = next((v for v in versions[page_id] if v.id == version_id), None)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    pages[page_id] = version.snapshot
    
    return {"success": True, "page": version.snapshot}


@app.post("/api/pages/{page_id}/blocks/{block_id}/vote")
async def vote(page_id: str, block_id: str, data: Dict[str, str]):
    vote_type = data.get("type")
    if vote_type not in ["happy", "sad", "surprised"]:
        raise HTTPException(status_code=400, detail="Invalid vote type")
    
    page = get_or_create_page(page_id)
    block = next((b for b in page.blocks if b.id == block_id), None)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    current = getattr(block.votes, vote_type)
    setattr(block.votes, vote_type, current + 1)
    block.updatedAt = datetime.now().timestamp()
    page.updatedAt = datetime.now().timestamp()
    
    return block


@app.websocket("/ws/{page_id}")
async def websocket_endpoint(websocket: WebSocket, page_id: str):
    await websocket.accept()
    
    if page_id not in active_connections:
        active_connections[page_id] = []
        online_users[page_id] = {}
    
    active_connections[page_id].append(websocket)
    
    current_user: Optional[UserInfo] = None
    
    try:
        page = get_or_create_page(page_id)
        await websocket.send_json({
            "type": "page-data",
            "page": page.dict()
        })
        
        for existing_user in online_users[page_id].values():
            await websocket.send_json({
                "type": "user-joined",
                **existing_user.dict()
            })
        
        async for message in websocket.iter_text():
            try:
                data = json.loads(message)
                event_type = data.get("type")
                
                if event_type == "join":
                    user_id = data.get("userId")
                    user_name = data.get("userName", "匿名用户")
                    color = USER_COLORS[len(online_users[page_id]) % len(USER_COLORS)]
                    initials = get_user_initials(user_name)
                    
                    current_user = UserInfo(
                        userId=user_id,
                        userName=user_name,
                        color=color,
                        userInitials=initials
                    )
                    online_users[page_id][user_id] = current_user
                    
                    for conn in active_connections[page_id]:
                        if conn != websocket:
                            await conn.send_json({
                                "type": "user-joined",
                                **current_user.dict()
                            })
                
                elif event_type == "block-update":
                    block_id = data.get("blockId")
                    content = data.get("content")
                    
                    if page_id in pages:
                        block = next((b for b in pages[page_id].blocks if b.id == block_id), None)
                        if block:
                            block.content = content
                            block.updatedAt = datetime.now().timestamp()
                            pages[page_id].updatedAt = datetime.now().timestamp()
                    
                    for conn in active_connections[page_id]:
                        if conn != websocket:
                            await conn.send_json({
                                "type": "block-updated",
                                "blockId": block_id,
                                "content": content,
                                "userId": data.get("userId", "")
                            })
                
                elif event_type == "block-reorder":
                    block_id = data.get("blockId")
                    new_index = data.get("newIndex", 0)
                    
                    if page_id in pages:
                        blocks = pages[page_id].blocks
                        old_index = next((i for i, b in enumerate(blocks) if b.id == block_id), -1)
                        if old_index != -1 and 0 <= new_index < len(blocks):
                            block = blocks.pop(old_index)
                            blocks.insert(new_index, block)
                            pages[page_id].updatedAt = datetime.now().timestamp()
                    
                    for conn in active_connections[page_id]:
                        if conn != websocket:
                            await conn.send_json({
                                "type": "block-reordered",
                                "blockId": block_id,
                                "newIndex": new_index,
                                "userId": data.get("userId", "")
                            })
                
                elif event_type == "block-create":
                    block_data = data.get("block")
                    index = data.get("index", 0)
                    
                    if page_id in pages and block_data:
                        block = Block(**block_data)
                        pages[page_id].blocks.insert(index, block)
                        pages[page_id].updatedAt = datetime.now().timestamp()
                    
                    for conn in active_connections[page_id]:
                        if conn != websocket:
                            await conn.send_json({
                                "type": "block-created",
                                "block": block_data,
                                "index": index,
                                "userId": data.get("userId", "")
                            })
                
                elif event_type == "block-delete":
                    block_id = data.get("blockId")
                    
                    if page_id in pages:
                        pages[page_id].blocks = [
                            b for b in pages[page_id].blocks if b.id != block_id
                        ]
                        pages[page_id].connections = [
                            c for c in pages[page_id].connections
                            if c.fromBlockId != block_id and c.toBlockId != block_id
                        ]
                        pages[page_id].updatedAt = datetime.now().timestamp()
                    
                    for conn in active_connections[page_id]:
                        if conn != websocket:
                            await conn.send_json({
                                "type": "block-deleted",
                                "blockId": block_id,
                                "userId": data.get("userId", "")
                            })
                
                elif event_type == "connection-create":
                    connection_data = data.get("connection")
                    
                    if page_id in pages and connection_data:
                        connection = Connection(**connection_data)
                        pages[page_id].connections.append(connection)
                        pages[page_id].updatedAt = datetime.now().timestamp()
                    
                    for conn in active_connections[page_id]:
                        if conn != websocket:
                            await conn.send_json({
                                "type": "connection-created",
                                "connection": connection_data,
                                "userId": data.get("userId", "")
                            })
                
                elif event_type == "cursor":
                    cursor_data = data
                    for conn in active_connections[page_id]:
                        if conn != websocket:
                            await conn.send_json({
                                "type": "cursor-update",
                                **cursor_data
                            })
                
                elif event_type == "vote":
                    block_id = data.get("blockId")
                    vote_type = data.get("type")
                    
                    if page_id in pages and vote_type in ["happy", "sad", "surprised"]:
                        block = next((b for b in pages[page_id].blocks if b.id == block_id), None)
                        if block:
                            current = getattr(block.votes, vote_type)
                            setattr(block.votes, vote_type, current + 1)
                            block.updatedAt = datetime.now().timestamp()
                            pages[page_id].updatedAt = datetime.now().timestamp()
                            
                            for conn in active_connections[page_id]:
                                await conn.send_json({
                                    "type": "vote-updated",
                                    "blockId": block_id,
                                    "votes": block.votes.dict(),
                                    "userId": data.get("userId", "")
                                })
                
                elif event_type == "rollback":
                    version_id = data.get("versionId")
                    
                    if page_id in versions:
                        version = next((v for v in versions[page_id] if v.id == version_id), None)
                        if version:
                            pages[page_id] = version.snapshot
                            
                            for conn in active_connections[page_id]:
                                await conn.send_json({
                                    "type": "page-rolled-back",
                                    "page": version.snapshot.dict(),
                                    "userId": data.get("userId", "")
                                })
                
                elif event_type == "operation":
                    op = data.get("op")
                    user_id = data.get("userId")
                    
                    if op and page_id in pages:
                        block_id = op.get("blockId")
                        block = next((b for b in pages[page_id].blocks if b.id == block_id), None)
                        if block:
                            block.content = transform_operation(block.content, op)
                            block.updatedAt = datetime.now().timestamp()
                            pages[page_id].updatedAt = datetime.now().timestamp()
                    
                    for conn in active_connections[page_id]:
                        if conn != websocket:
                            await conn.send_json({
                                "type": "operation",
                                "op": op,
                                "userId": user_id
                            })
            
            except json.JSONDecodeError:
                continue
    
    except WebSocketDisconnect:
        pass
    
    finally:
        if websocket in active_connections.get(page_id, []):
            active_connections[page_id].remove(websocket)
        
        if current_user and current_user.userId in online_users.get(page_id, {}):
            del online_users[page_id][current_user.userId]
            
            for conn in active_connections.get(page_id, []):
                await conn.send_json({
                    "type": "user-left",
                    "userId": current_user.userId
                })
        
        if page_id in active_connections and len(active_connections[page_id]) == 0:
            del active_connections[page_id]
            if page_id in online_users:
                del online_users[page_id]


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
