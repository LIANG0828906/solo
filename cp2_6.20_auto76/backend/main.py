import uuid
import random
from datetime import datetime

import socketio
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
fastapi_app = FastAPI()
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

rooms_db: dict = {}
messages_db: dict = {}
nodes_db: dict = {}
connections_db: dict = {}

seed_rooms = [
    {"name": "AI法律人格", "topic": "人工智能是否应当被赋予法律人格？"},
    {"name": "远程办公vs现场办公", "topic": "远程办公是否优于现场办公？"},
    {"name": "社交媒体与民主", "topic": "社交媒体对民主制度是利大于弊还是弊大于利？"},
]

for seed in seed_rooms:
    room_id = str(uuid.uuid4())
    rooms_db[room_id] = {
        "id": room_id,
        "name": seed["name"],
        "topic": seed["topic"],
        "status": "active",
        "participants": 0,
        "createdAt": datetime.now().isoformat(),
    }
    messages_db[room_id] = []
    nodes_db[room_id] = []
    connections_db[room_id] = []


@fastapi_app.get("/api/rooms")
async def get_rooms():
    return list(rooms_db.values())


@fastapi_app.post("/api/rooms")
async def create_room(request: Request):
    body = await request.json()
    room_id = str(uuid.uuid4())
    room = {
        "id": room_id,
        "name": body.get("name", ""),
        "topic": body.get("topic", ""),
        "status": "active",
        "participants": 0,
        "createdAt": datetime.now().isoformat(),
    }
    rooms_db[room_id] = room
    messages_db[room_id] = []
    nodes_db[room_id] = []
    connections_db[room_id] = []
    return room


@fastapi_app.get("/api/rooms/{room_id}")
async def get_room(room_id: str):
    if room_id not in rooms_db:
        raise HTTPException(status_code=404, detail="Room not found")
    return rooms_db[room_id]


@fastapi_app.get("/api/rooms/{room_id}/messages")
async def get_messages(room_id: str):
    if room_id not in rooms_db:
        raise HTTPException(status_code=404, detail="Room not found")
    return messages_db.get(room_id, [])


@fastapi_app.get("/api/rooms/{room_id}/nodes")
async def get_nodes(room_id: str):
    if room_id not in rooms_db:
        raise HTTPException(status_code=404, detail="Room not found")
    return nodes_db.get(room_id, [])


@fastapi_app.get("/api/rooms/{room_id}/connections")
async def get_connections(room_id: str):
    if room_id not in rooms_db:
        raise HTTPException(status_code=404, detail="Room not found")
    return connections_db.get(room_id, [])


@fastapi_app.post("/api/rooms/{room_id}/end")
async def end_room(room_id: str):
    if room_id not in rooms_db:
        raise HTTPException(status_code=404, detail="Room not found")
    rooms_db[room_id]["status"] = "ended"
    return rooms_db[room_id]


@fastapi_app.get("/api/rooms/{room_id}/report")
async def get_report(room_id: str):
    if room_id not in rooms_db:
        raise HTTPException(status_code=404, detail="Room not found")

    msgs = messages_db.get(room_id, [])
    conns = connections_db.get(room_id, [])
    nds = nodes_db.get(room_id, [])

    total_messages = len(msgs)

    avg_reply_delay = 0.0
    if len(msgs) > 1:
        sorted_msgs = sorted(msgs, key=lambda m: m["timestamp"])
        delays = []
        for i in range(1, len(sorted_msgs)):
            t1 = datetime.fromisoformat(sorted_msgs[i - 1]["timestamp"])
            t2 = datetime.fromisoformat(sorted_msgs[i]["timestamp"])
            delays.append((t2 - t1).total_seconds())
        avg_reply_delay = sum(delays) / len(delays)

    support_timeline = []
    pro_count = 0
    con_count = 0
    for msg in sorted(msgs, key=lambda m: m["timestamp"]):
        if msg["side"] == "pro":
            pro_count += 1
        else:
            con_count += 1
        support_timeline.append({"pro": pro_count, "con": con_count})

    incoming_count: dict = {}
    for conn in conns:
        target = conn["to"]
        incoming_count[target] = incoming_count.get(target, 0) + 1

    node_id_to_node = {n["id"]: n for n in nds}
    ranked = sorted(incoming_count.items(), key=lambda x: x[1], reverse=True)
    most_replied = []
    for node_id, count in ranked[:5]:
        node = node_id_to_node.get(node_id)
        if node:
            most_replied.append({
                "nodeId": node_id,
                "content": node["content"],
                "side": node["side"],
                "incomingConnections": count,
            })

    return {
        "totalMessages": total_messages,
        "avgReplyDelay": avg_reply_delay,
        "supportTimeline": support_timeline,
        "mostReplied": most_replied,
    }


@sio.event
async def connect(sid, environ):
    pass


@sio.event
async def disconnect(sid):
    pass


@sio.event
async def join_room(sid, data):
    room_id = data.get("roomId")
    if room_id and room_id in rooms_db:
        sio.enter_room(sid, room_id)
        rooms_db[room_id]["participants"] += 1
        await sio.emit("room_updated", rooms_db[room_id], room=room_id)


@sio.event
async def leave_room(sid, data):
    room_id = data.get("roomId")
    if room_id and room_id in rooms_db:
        sio.leave_room(sid, room_id)
        rooms_db[room_id]["participants"] = max(0, rooms_db[room_id]["participants"] - 1)
        await sio.emit("room_updated", rooms_db[room_id], room=room_id)


@sio.event
async def send_message(sid, data):
    room_id = data.get("roomId")
    if room_id not in rooms_db:
        return

    user_id = data.get("userId", "")
    side = data.get("side", "pro")
    content = data.get("content", "")
    parent_node_id = data.get("parentNodeId")
    connection_type = data.get("connectionType")

    msg_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()

    message = {
        "id": msg_id,
        "roomId": room_id,
        "userId": user_id,
        "side": side,
        "content": content,
        "timestamp": timestamp,
    }
    if parent_node_id:
        message["parentNodeId"] = parent_node_id
    messages_db[room_id].append(message)
    await sio.emit("new_message", message, room=room_id)

    node_id = str(uuid.uuid4())
    node_count = len(nodes_db.get(room_id, []))
    x = 150 + random.randint(-50, 50) + (node_count % 5) * 120
    y = 150 + random.randint(-50, 50) + (node_count // 5) * 120

    node = {
        "id": node_id,
        "messageId": msg_id,
        "side": side,
        "content": content,
        "support": 0,
        "x": x,
        "y": y,
    }
    nodes_db[room_id].append(node)
    await sio.emit("new_node", node, room=room_id)

    if parent_node_id and connection_type:
        conn_id = str(uuid.uuid4())
        connection = {
            "id": conn_id,
            "from": node_id,
            "to": parent_node_id,
            "type": connection_type,
        }
        connections_db[room_id].append(connection)
        await sio.emit("new_connection", connection, room=room_id)


@sio.event
async def connect_argument(sid, data):
    room_id = data.get("roomId")
    if room_id not in rooms_db:
        return

    from_node_id = data.get("fromNodeId")
    to_node_id = data.get("toNodeId")
    conn_type = data.get("type", "support")

    conn_id = str(uuid.uuid4())
    connection = {
        "id": conn_id,
        "from": from_node_id,
        "to": to_node_id,
        "type": conn_type,
    }
    connections_db[room_id].append(connection)
    await sio.emit("new_connection", connection, room=room_id)


@sio.event
async def disconnect_argument(sid, data):
    room_id = data.get("roomId")
    connection_id = data.get("connectionId")
    if room_id not in rooms_db:
        return

    conns = connections_db.get(room_id, [])
    connections_db[room_id] = [c for c in conns if c["id"] != connection_id]
    await sio.emit("connection_removed", {"connectionId": connection_id}, room=room_id)


@sio.event
async def support_node(sid, data):
    room_id = data.get("roomId")
    node_id = data.get("nodeId")
    if room_id not in rooms_db:
        return

    for node in nodes_db.get(room_id, []):
        if node["id"] == node_id:
            node["support"] += 1
            await sio.emit("node_updated", node, room=room_id)
            break
