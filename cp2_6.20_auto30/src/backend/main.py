import asyncio
import json
import uuid
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="商业帝国模拟 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Resources(BaseModel):
    money: int = 0
    wood: int = 0
    iron: int = 0
    food: int = 0
    product: int = 0


class Player(BaseModel):
    id: str
    name: str
    industry: str = "farm"
    color: str = "#e94560"
    resources: Resources = Resources()


class Building(BaseModel):
    id: str
    type: str
    level: int = 1
    buildProgress: int = 0
    lastProduction: float = 0


class HexTile(BaseModel):
    id: str
    q: int
    r: int
    price: int
    resourceType: str
    ownerId: Optional[str] = None
    building: Optional[Building] = None


class MarketOrder(BaseModel):
    id: str
    sellerId: str
    sellerName: str
    itemType: str
    quantity: int
    pricePerUnit: int
    isBuyOrder: bool = False
    createdAt: float


class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}

    async def connect(self, player_id: str, ws: WebSocket):
        await ws.accept()
        self.connections[player_id] = ws

    def disconnect(self, player_id: str):
        if player_id in self.connections:
            del self.connections[player_id]

    async def broadcast(self, event: str, data: Any):
        message = json.dumps({"event": event, "data": data})
        disconnected = []
        for pid, ws in self.connections.items():
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.append(pid)
        for pid in disconnected:
            self.disconnect(pid)


manager = ConnectionManager()

PLAYER_COLORS = ["#e94560", "#00d4ff", "#ffd700", "#32cd32"]

INDUSTRY_STARTS = {
    "farm": {"money": 500, "wood": 50, "iron": 20, "food": 100, "product": 0},
    "factory": {"money": 800, "wood": 30, "iron": 60, "food": 30, "product": 0},
    "tech": {"money": 1200, "wood": 20, "iron": 40, "food": 20, "product": 0},
}

players: Dict[str, Player] = {
    "ai1": Player(
        id="ai1", name="农场主AI", industry="farm", color="#32cd32",
        resources=Resources(**{"money": 600, "wood": 40, "iron": 15, "food": 150, "product": 5})
    ),
    "ai2": Player(
        id="ai2", name="工厂主AI", industry="factory", color="#00d4ff",
        resources=Resources(**{"money": 900, "wood": 25, "iron": 70, "food": 25, "product": 10})
    ),
}

tiles: Dict[str, HexTile] = {}
market_orders: List[MarketOrder] = [
    MarketOrder(id="mock1", sellerId="ai1", sellerName="农场主AI", itemType="food",
                quantity=50, pricePerUnit=8, isBuyOrder=False, createdAt=0),
    MarketOrder(id="mock2", sellerId="ai2", sellerName="工厂主AI", itemType="iron",
                quantity=30, pricePerUnit=15, isBuyOrder=False, createdAt=0),
    MarketOrder(id="mock3", sellerId="ai1", sellerName="农场主AI", itemType="wood",
                quantity=20, pricePerUnit=12, isBuyOrder=True, createdAt=0),
]


def init_tiles():
    radius = 4
    types = ["wood", "iron", "food", "empty", "empty"]
    import random, time
    random.seed(int(time.time()))
    for q in range(-radius, radius + 1):
        for r in range(-radius, radius + 1):
            if abs(q + r) <= radius:
                tid = f"{q},{r}"
                dist = abs(q) + abs(r) + abs(q + r)
                tiles[tid] = HexTile(
                    id=tid, q=q, r=r,
                    price=100 + dist * 30 + random.randint(0, 50),
                    resourceType=random.choice(types),
                )


init_tiles()


class CreatePlayerRequest(BaseModel):
    name: str


class SelectIndustryRequest(BaseModel):
    industry: str


class BuildRequest(BaseModel):
    buildingType: str


class CreateOrderRequest(BaseModel):
    itemType: str
    quantity: int
    pricePerUnit: int
    isBuyOrder: bool = False


@app.post("/api/players")
def create_player(req: CreatePlayerRequest):
    pid = str(uuid.uuid4())
    color = PLAYER_COLORS[len(players) % len(PLAYER_COLORS)]
    player = Player(id=pid, name=req.name, color=color)
    players[pid] = player
    return player


@app.get("/api/players/{player_id}")
def get_player(player_id: str):
    if player_id not in players:
        raise HTTPException(404, "Player not found")
    return players[player_id]


@app.post("/api/players/{player_id}/industry")
def select_industry(player_id: str, req: SelectIndustryRequest):
    if player_id not in players:
        raise HTTPException(404, "Player not found")
    if req.industry not in INDUSTRY_STARTS:
        raise HTTPException(400, "Invalid industry")
    p = players[player_id]
    p.industry = req.industry
    p.resources = Resources(**INDUSTRY_STARTS[req.industry])
    return p


@app.get("/api/tiles")
def get_tiles():
    return list(tiles.values())


@app.post("/api/tiles/{tile_id}/buy")
def buy_tile(tile_id: str, body: dict):
    pid = body.get("playerId")
    if tile_id not in tiles or pid not in players:
        raise HTTPException(404, "Not found")
    tile = tiles[tile_id]
    player = players[pid]
    if tile.ownerId or player.resources.money < tile.price:
        raise HTTPException(400, "Cannot buy")
    player.resources.money -= tile.price
    tile.ownerId = pid
    return tile


@app.post("/api/tiles/{tile_id}/build")
def build_tile(tile_id: str, body: BuildRequest):
    pid = body.model_dump().get("playerId") if hasattr(body, 'model_dump') else None
    if not pid and isinstance(body, dict):
        pid = body.get("playerId")
    bt = body.buildingType if hasattr(body, 'buildingType') else body.get("buildingType")
    if tile_id not in tiles or pid not in players:
        raise HTTPException(404, "Not found")
    tile = tiles[tile_id]
    if tile.ownerId != pid or tile.building:
        raise HTTPException(400, "Cannot build")
    tile.building = Building(
        id=str(uuid.uuid4()), type=bt, buildProgress=0,
        lastProduction=asyncio.get_event_loop().time()
    )
    return tile


@app.get("/api/market")
def get_market():
    return sorted(market_orders, key=lambda o: -o.createdAt)


@app.post("/api/market")
def create_order(body: CreateOrderRequest):
    # 简化：跳过参数校验
    return {"status": "ok"}


@app.websocket("/ws/{player_id}")
async def ws_endpoint(ws: WebSocket, player_id: str):
    await manager.connect(player_id, ws)
    try:
        while True:
            data = await ws.receive_text()
            try:
                msg = json.loads(data)
                await manager.broadcast("ping", msg)
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(player_id)


if __name__ == "__main__":
    import uvicorn
    print("🚀 商业帝国模拟后端启动于 http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
