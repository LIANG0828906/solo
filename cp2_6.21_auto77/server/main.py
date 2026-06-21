import uuid
import json
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi.responses import JSONResponse, StreamingResponse
import io

import database
from semantic_service import SemanticService

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

semantic_service = SemanticService(similarity_threshold=0.3)


class CreateRoomRequest(BaseModel):
    roomName: str = Field(..., max_length=100)


class NodeInput(BaseModel):
    id: Optional[str] = None
    roomId: Optional[str] = None
    title: str = Field(..., max_length=50)
    note: str = Field(default='', max_length=200)
    tags: List[str] = Field(default_factory=list)
    x: float = 0
    y: float = 0
    width: float = 200
    height: float = 80
    groupId: Optional[str] = None


class NodeMoveInput(BaseModel):
    id: str
    x: float
    y: float


class NodeUpdateInput(BaseModel):
    id: str
    title: Optional[str] = Field(default=None, max_length=50)
    note: Optional[str] = Field(default=None, max_length=200)
    tags: Optional[List[str]] = None
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    groupId: Optional[str] = None


class ConnectionInput(BaseModel):
    id: Optional[str] = None
    roomId: Optional[str] = None
    fromNodeId: str
    toNodeId: str


class DeleteItemInput(BaseModel):
    id: str


class SemanticGroupInput(BaseModel):
    nodes: List[Dict[str, Any]]


class GroupUpdateInput(BaseModel):
    id: str
    keyword: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        self.room_users: Dict[str, Dict[str, Dict[str, Any]]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, user_name: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
            self.room_users[room_id] = {}
        self.active_connections[room_id][user_id] = websocket
        self.room_users[room_id][user_id] = {
            'id': user_id,
            'name': user_name,
            'avatar': f'https://api.dicebear.com/7.x/avataaars/svg?seed={user_name}',
            'cursorX': 0,
            'cursorY': 0,
        }

    def disconnect(self, room_id: str, user_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].pop(user_id, None)
            if not self.active_connections[room_id]:
                self.active_connections.pop(room_id, None)
        if room_id in self.room_users:
            self.room_users[room_id].pop(user_id, None)
            if not self.room_users[room_id]:
                self.room_users.pop(room_id, None)

    async def broadcast(self, room_id: str, message: Dict[str, Any], exclude_user: Optional[str] = None):
        if room_id in self.active_connections:
            for user_id, connection in self.active_connections[room_id].items():
                if user_id != exclude_user:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        pass

    def get_users(self, room_id: str) -> List[Dict[str, Any]]:
        if room_id in self.room_users:
            return list(self.room_users[room_id].values())
        return []

    def update_cursor(self, room_id: str, user_id: str, x: float, y: float):
        if room_id in self.room_users and user_id in self.room_users[room_id]:
            self.room_users[room_id][user_id]['cursorX'] = x
            self.room_users[room_id][user_id]['cursorY'] = y


manager = ConnectionManager()


@app.on_event("startup")
def startup():
    database.init_db()


@app.get("/")
async def root():
    return {"message": "Auto77 Brainstorm API"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/rooms")
async def create_room(req: CreateRoomRequest):
    room_id = str(uuid.uuid4())
    conn = next(database.get_db())
    success = database.create_room(conn, room_id, req.roomName)
    conn.close()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create room")
    return {"roomId": room_id, "roomName": req.roomName}


@app.get("/api/rooms/{room_id}")
async def get_room_state(room_id: str):
    conn = next(database.get_db())
    room = database.get_room(conn, room_id)
    if not room:
        conn.close()
        raise HTTPException(status_code=404, detail="Room not found")

    nodes = database.get_nodes_by_room(conn, room_id)
    connections = database.get_connections_by_room(conn, room_id)
    groups = database.get_groups_by_room(conn, room_id)

    nodes_out = []
    for n in nodes:
        nodes_out.append({
            'id': n['id'],
            'roomId': n['room_id'],
            'title': n['title'],
            'note': n['note'],
            'tags': n['tags'],
            'x': n['x'],
            'y': n['y'],
            'width': n['width'],
            'height': n['height'],
            'groupId': n.get('group_id'),
            'createdAt': n['created_at'],
            'updatedAt': n['updated_at'],
        })

    connections_out = []
    for c in connections:
        connections_out.append({
            'id': c['id'],
            'roomId': c['room_id'],
            'fromNodeId': c['from_node_id'],
            'toNodeId': c['to_node_id'],
            'createdAt': c['created_at'],
        })

    groups_out = []
    for g in groups:
        group_node_ids = [n['id'] for n in nodes if n.get('group_id') == g['id']]
        groups_out.append({
            'id': g['id'],
            'roomId': g['room_id'],
            'keyword': g['keyword'],
            'nodeIds': group_node_ids,
            'x': g['x'],
            'y': g['y'],
            'width': g['width'],
            'height': g['height'],
        })

    conn.close()
    return {
        'nodes': nodes_out,
        'connections': connections_out,
        'groups': groups_out,
        'users': manager.get_users(room_id),
    }


@app.post("/api/rooms/{room_id}/export")
async def export_room(room_id: str):
    conn = next(database.get_db())
    room = database.get_room(conn, room_id)
    if not room:
        conn.close()
        raise HTTPException(status_code=404, detail="Room not found")

    state = await get_room_state(room_id)
    conn.close()

    export_data = {
        'version': '1.0',
        'roomId': room_id,
        'roomName': room['name'],
        'exportedAt': room.get('updated_at', ''),
        'nodes': state['nodes'],
        'connections': state['connections'],
        'groups': state['groups'],
    }

    content = json.dumps(export_data, ensure_ascii=False, indent=2)
    return StreamingResponse(
        io.BytesIO(content.encode('utf-8')),
        media_type='application/json',
        headers={'Content-Disposition': f'attachment; filename="brainstorm_{room_id}.json"'}
    )


@app.post("/api/rooms/{room_id}/import")
async def import_room(room_id: str, file: UploadFile = File(...)):
    content = await file.read()
    try:
        data = json.loads(content.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    conn = next(database.get_db())
    database.clear_room(conn, room_id)

    for g in data.get('groups', []):
        database.create_group(
            conn,
            group_id=g.get('id', str(uuid.uuid4())),
            room_id=room_id,
            keyword=g.get('keyword', '未命名组'),
            x=g.get('x', 0),
            y=g.get('y', 0),
            width=g.get('width', 400),
            height=g.get('height', 300),
        )

    for n in data.get('nodes', []):
        database.create_node(
            conn,
            node_id=n.get('id', str(uuid.uuid4())),
            room_id=room_id,
            title=n.get('title', ''),
            note=n.get('note', ''),
            tags=n.get('tags', []),
            x=n.get('x', 0),
            y=n.get('y', 0),
            width=n.get('width', 200),
            height=n.get('height', 80),
            group_id=n.get('groupId'),
        )

    for c in data.get('connections', []):
        database.create_connection(
            conn,
            conn_id=c.get('id', str(uuid.uuid4())),
            room_id=room_id,
            from_node_id=c.get('fromNodeId', ''),
            to_node_id=c.get('toNodeId', ''),
        )

    conn.close()

    await manager.broadcast(room_id, {
        'type': 'roomReset',
    })

    return {'success': True}


@app.post("/api/semantic/group")
async def semantic_group(req: SemanticGroupInput):
    try:
        groups = semantic_service.group_items(req.nodes)
        return {'groups': groups}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/semantic/similarity")
async def semantic_similarity(req: SemanticGroupInput):
    if len(req.nodes) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 nodes")
    try:
        similarities = []
        for i in range(len(req.nodes)):
            for j in range(i + 1, len(req.nodes)):
                sim = semantic_service.calculate_similarity(
                    req.nodes[i].get('title', ''),
                    req.nodes[j].get('title', '')
                )
                similarities.append({
                    'node1': req.nodes[i].get('id'),
                    'node2': req.nodes[j].get('id'),
                    'similarity': sim,
                })
        return {'similarities': similarities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/rooms/{room_id}/clear")
async def clear_room(room_id: str):
    conn = next(database.get_db())
    room = database.get_room(conn, room_id)
    if not room:
        conn.close()
        raise HTTPException(status_code=404, detail="Room not found")
    database.clear_room(conn, room_id)
    conn.close()

    await manager.broadcast(room_id, {
        'type': 'roomReset',
    })

    return {'success': True}


@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    conn = next(database.get_db())
    room = database.get_room(conn, room_id)
    conn.close()
    if not room:
        await websocket.close(code=1008, reason="Room not found")
        return

    user_id = None
    user_name = None

    try:
        data = await websocket.receive_json()
        if data.get('type') != 'joinRoom':
            await websocket.close(code=1008, reason="Expected joinRoom")
            return
        user_id = data.get('userId') or str(uuid.uuid4())
        user_name = data.get('userName') or f'用户_{user_id[:6]}'

        await manager.connect(websocket, room_id, user_id, user_name)

        state_response = await get_room_state(room_id)
        await websocket.send_json({
            'type': 'roomState',
            'userId': user_id,
            **state_response,
        })

        await manager.broadcast(room_id, {
            'type': 'userJoin',
            'user': {
                'id': user_id,
                'name': user_name,
                'avatar': f'https://api.dicebear.com/7.x/avataaars/svg?seed={user_name}',
                'cursorX': 0,
                'cursorY': 0,
            },
        }, exclude_user=user_id)

        while True:
            try:
                data = await websocket.receive_json()
                msg_type = data.get('type')

                if msg_type == 'nodeCreate':
                    conn = next(database.get_db())
                    node_data = data.get('node', {})
                    node = database.create_node(
                        conn,
                        node_id=node_data.get('id') or str(uuid.uuid4()),
                        room_id=room_id,
                        title=node_data.get('title', ''),
                        note=node_data.get('note', ''),
                        tags=node_data.get('tags', []),
                        x=node_data.get('x', 0),
                        y=node_data.get('y', 0),
                        width=node_data.get('width', 200),
                        height=node_data.get('height', 80),
                        group_id=node_data.get('groupId'),
                    )
                    conn.close()
                    if node:
                        node_out = {
                            'id': node['id'],
                            'roomId': node['room_id'],
                            'title': node['title'],
                            'note': node['note'],
                            'tags': node['tags'],
                            'x': node['x'],
                            'y': node['y'],
                            'width': node['width'],
                            'height': node['height'],
                            'groupId': node.get('group_id'),
                            'createdAt': node['created_at'],
                            'updatedAt': node['updated_at'],
                        }
                        await manager.broadcast(room_id, {
                            'type': 'nodeUpdate',
                            'node': node_out,
                        })

                elif msg_type == 'nodeMove':
                    move_data = data.get('data', {})
                    conn = next(database.get_db())
                    node = database.update_node(
                        conn,
                        move_data.get('id', ''),
                        x=move_data.get('x', 0),
                        y=move_data.get('y', 0),
                    )
                    conn.close()
                    if node:
                        node_out = {
                            'id': node['id'],
                            'roomId': node['room_id'],
                            'title': node['title'],
                            'note': node['note'],
                            'tags': node['tags'],
                            'x': node['x'],
                            'y': node['y'],
                            'width': node['width'],
                            'height': node['height'],
                            'groupId': node.get('group_id'),
                            'createdAt': node['created_at'],
                            'updatedAt': node['updated_at'],
                        }
                        await manager.broadcast(room_id, {
                            'type': 'nodeUpdate',
                            'node': node_out,
                        }, exclude_user=user_id)

                elif msg_type == 'nodeUpdate':
                    update_data = data.get('node', {})
                    conn = next(database.get_db())
                    fields = {}
                    if 'title' in update_data:
                        fields['title'] = update_data['title']
                    if 'note' in update_data:
                        fields['note'] = update_data['note']
                    if 'tags' in update_data:
                        fields['tags'] = update_data['tags']
                    if 'x' in update_data:
                        fields['x'] = update_data['x']
                    if 'y' in update_data:
                        fields['y'] = update_data['y']
                    if 'width' in update_data:
                        fields['width'] = update_data['width']
                    if 'height' in update_data:
                        fields['height'] = update_data['height']
                    if 'groupId' in update_data:
                        fields['group_id'] = update_data['groupId']
                    node = database.update_node(conn, update_data.get('id', ''), **fields)
                    conn.close()
                    if node:
                        node_out = {
                            'id': node['id'],
                            'roomId': node['room_id'],
                            'title': node['title'],
                            'note': node['note'],
                            'tags': node['tags'],
                            'x': node['x'],
                            'y': node['y'],
                            'width': node['width'],
                            'height': node['height'],
                            'groupId': node.get('group_id'),
                            'createdAt': node['created_at'],
                            'updatedAt': node['updated_at'],
                        }
                        await manager.broadcast(room_id, {
                            'type': 'nodeUpdate',
                            'node': node_out,
                        }, exclude_user=user_id)

                elif msg_type == 'nodeDelete':
                    del_data = data.get('data', {})
                    conn = next(database.get_db())
                    success = database.delete_node(conn, del_data.get('id', ''))
                    conn.close()
                    if success:
                        await manager.broadcast(room_id, {
                            'type': 'nodeDelete',
                            'id': del_data.get('id'),
                        })

                elif msg_type == 'connectionCreate':
                    conn_data = data.get('connection', {})
                    conn = next(database.get_db())
                    connection = database.create_connection(
                        conn,
                        conn_id=conn_data.get('id') or str(uuid.uuid4()),
                        room_id=room_id,
                        from_node_id=conn_data.get('fromNodeId', ''),
                        to_node_id=conn_data.get('toNodeId', ''),
                    )
                    conn.close()
                    if connection:
                        conn_out = {
                            'id': connection['id'],
                            'roomId': connection['room_id'],
                            'fromNodeId': connection['from_node_id'],
                            'toNodeId': connection['to_node_id'],
                            'createdAt': connection['created_at'],
                        }
                        await manager.broadcast(room_id, {
                            'type': 'connectionUpdate',
                            'connections': [conn_out],
                        })

                elif msg_type == 'connectionDelete':
                    del_data = data.get('data', {})
                    conn = next(database.get_db())
                    success = database.delete_connection(conn, del_data.get('id', ''))
                    conn.close()
                    if success:
                        await manager.broadcast(room_id, {
                            'type': 'connectionDelete',
                            'id': del_data.get('id'),
                        })

                elif msg_type == 'cursorUpdate':
                    cursor_data = data.get('data', {})
                    manager.update_cursor(
                        room_id,
                        user_id,
                        cursor_data.get('x', 0),
                        cursor_data.get('y', 0),
                    )
                    await manager.broadcast(room_id, {
                        'type': 'cursorUpdate',
                        'userId': user_id,
                        'x': cursor_data.get('x', 0),
                        'y': cursor_data.get('y', 0),
                    }, exclude_user=user_id)

                elif msg_type == 'groupUpdate':
                    group_data = data.get('group', {})
                    conn = next(database.get_db())
                    fields = {}
                    if 'keyword' in group_data:
                        fields['keyword'] = group_data['keyword']
                    if 'x' in group_data:
                        fields['x'] = group_data['x']
                    if 'y' in group_data:
                        fields['y'] = group_data['y']
                    if 'width' in group_data:
                        fields['width'] = group_data['width']
                    if 'height' in group_data:
                        fields['height'] = group_data['height']
                    group = database.update_group(conn, group_data.get('id', ''), **fields)
                    conn.close()
                    if group:
                        conn_db = next(database.get_db())
                        nodes = database.get_nodes_by_room(conn_db, room_id)
                        conn_db.close()
                        group_node_ids = [n['id'] for n in nodes if n.get('group_id') == group['id']]
                        group_out = {
                            'id': group['id'],
                            'roomId': group['room_id'],
                            'keyword': group['keyword'],
                            'nodeIds': group_node_ids,
                            'x': group['x'],
                            'y': group['y'],
                            'width': group['width'],
                            'height': group['height'],
                        }
                        await manager.broadcast(room_id, {
                            'type': 'groupUpdate',
                            'groups': [group_out],
                        }, exclude_user=user_id)

            except WebSocketDisconnect:
                break
            except Exception:
                continue

    except WebSocketDisconnect:
        pass
    finally:
        if user_id:
            manager.disconnect(room_id, user_id)
            await manager.broadcast(room_id, {
                'type': 'userLeave',
                'userId': user_id,
            })
