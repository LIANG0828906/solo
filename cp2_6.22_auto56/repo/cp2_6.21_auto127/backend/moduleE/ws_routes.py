import json
import os
import sys

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from moduleE.ws_manager import manager
from database import get_db
import models
from auth import get_current_user

router = APIRouter()


@router.websocket("/ws/{doc_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    doc_id: int,
):
    await manager.connect(websocket, doc_id)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type")
                payload = message.get("payload", {})

                if msg_type in ["annotation_add", "annotation_delete", "add_annotation", "new_annotation", "clear_paragraph_annotations"]:
                    await manager.broadcast_to_doc(doc_id, message)

            except json.JSONDecodeError:
                continue

    except WebSocketDisconnect:
        manager.disconnect(websocket, doc_id)
