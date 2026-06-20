from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio
from datetime import datetime
from typing import Dict, Set

from backend.models import Consumable, consumables_db

router = APIRouter()

active_connections: Set[WebSocket] = set()
alerted_consumables: Dict[str, float] = {}


@router.websocket("/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                if message.get("type") == "pong":
                    continue
            except:
                pass
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        active_connections.discard(websocket)


async def check_alerts_task():
    from backend.routes.inventory import calculate_safety_threshold

    while True:
        try:
            now = datetime.now().timestamp()

            for cid, consumable in consumables_db.items():
                safety_threshold = calculate_safety_threshold(consumable.id, consumable.purchaseCycle)
                if consumable.currentStock < safety_threshold:
                    last_alert = alerted_consumables.get(cid, 0)
                    if now - last_alert > 30:
                        alert_message = {
                            "type": "alert",
                            "data": {
                                "consumableId": consumable.id,
                                "consumableName": consumable.name,
                                "currentStock": consumable.currentStock,
                                "safetyThreshold": safety_threshold,
                            }
                        }

                        disconnected = set()
                        for connection in active_connections:
                            try:
                                await connection.send_text(json.dumps(alert_message))
                            except:
                                disconnected.add(connection)

                        for conn in disconnected:
                            active_connections.discard(conn)

                        alerted_consumables[cid] = now

            for connection in active_connections:
                try:
                    await connection.send_text(json.dumps({"type": "ping"}))
                except:
                    pass

        except Exception as e:
            print(f"Alert check error: {e}")

        await asyncio.sleep(30)
