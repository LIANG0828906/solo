import asyncio
import json
import uuid
import time
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

    def to_dict(self) -> Dict[str, int]:
        return {"money": self.money, "wood": self.wood, "iron": self.iron,
                "food": self.food, "product": self.product}


class Player(BaseModel):
    id: str
    name: str
    industry: str = "farm"
    color: str = "#e94560"
    resources: Resources = Resources()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id, "name": self.name, "industry": self.industry,
            "color": self.color, "resources": self.resources.to_dict()
        }


class Building(BaseModel):
    id: str
    type: str
    level: int = 1
    buildProgress: int = 0
    lastProduction: float = 0

    def to_dict(self) -> Dict[str, Any]:
        return {"id": self.id, "type": self.type, "level": self.level,
                "buildProgress": self.buildProgress, "lastProduction": self.lastProduction}


class HexTile(BaseModel):
    id: str
    q: int
    r: int
    price: int
    resourceType: str
    ownerId: Optional[str] = None
    building: Optional[Building] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id, "q": self.q, "r": self.r, "price": self.price,
            "resourceType": self.resourceType, "ownerId": self.ownerId,
            "building": self.building.to_dict() if self.building else None
        }


class MarketOrder(BaseModel):
    id: str
    sellerId: str
    sellerName: str
    itemType: str
    quantity: int
    pricePerUnit: int
    isBuyOrder: bool = False
    createdAt: float
    justFilled: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id, "sellerId": self.sellerId, "sellerName": self.sellerName,
            "itemType": self.itemType, "quantity": self.quantity,
            "pricePerUnit": self.pricePerUnit, "isBuyOrder": self.isBuyOrder,
            "createdAt": self.createdAt, "justFilled": self.justFilled
        }


class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}

    async def connect(self, player_id: str, ws: WebSocket):
        await ws.accept()
        self.connections[player_id] = ws
        await self.broadcast("player_joined", players[player_id].to_dict())

    def disconnect(self, player_id: str):
        if player_id in self.connections:
            del self.connections[player_id]

    async def broadcast(self, event: str, data: Any):
        message = json.dumps({"event": event, "data": data})
        disconnected = []
        for pid, ws in list(self.connections.items()):
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.append(pid)
        for pid in disconnected:
            self.disconnect(pid)

    async def send_to(self, player_id: str, event: str, data: Any):
        if player_id in self.connections:
            try:
                await self.connections[player_id].send_text(json.dumps({"event": event, "data": data}))
            except Exception:
                self.disconnect(player_id)


manager = ConnectionManager()

PLAYER_COLORS = ["#e94560", "#00d4ff", "#ffd700", "#32cd32"]

INDUSTRY_STARTS = {
    "farm": {"money": 500, "wood": 50, "iron": 20, "food": 100, "product": 0},
    "factory": {"money": 800, "wood": 30, "iron": 60, "food": 30, "product": 0},
    "tech": {"money": 1200, "wood": 20, "iron": 40, "food": 20, "product": 0},
}

BUILDING_COSTS: Dict[str, Dict[str, int]] = {
    "lumbermill": {"money": 200, "wood": 50},
    "mine": {"money": 300, "wood": 30, "iron": 20},
    "factory": {"money": 500, "wood": 100, "iron": 80},
    "farm": {"money": 150, "wood": 40},
    "techlab": {"money": 800, "wood": 60, "iron": 100, "food": 50},
}

BUILDING_OUTPUTS: Dict[str, Dict[str, Any]] = {
    "lumbermill": {"resource": "wood", "amount": 5},
    "mine": {"resource": "iron", "amount": 3},
    "factory": {"resource": "product", "amount": 2},
    "farm": {"resource": "food", "amount": 8},
    "techlab": {"resource": "product", "amount": 5},
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
market_orders: List[MarketOrder] = []


def init_tiles():
    import random
    radius = 4
    types = ["wood", "iron", "food", "empty", "empty"]
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


class PlayerIdRequest(BaseModel):
    playerId: str


class BuildRequest(PlayerIdRequest):
    buildingType: str


class CreateOrderRequest(PlayerIdRequest):
    itemType: str
    quantity: int
    pricePerUnit: int
    isBuyOrder: bool = False


class AcceptOrderRequest(PlayerIdRequest):
    pass


async def game_loop():
    while True:
        now = time.time()
        for tile in tiles.values():
            if tile.building and tile.building.buildProgress < 100:
                tile.building.buildProgress = min(100, tile.building.buildProgress + 5)
                await manager.broadcast("building_progress", {
                    "tileId": tile.id, "progress": tile.building.buildProgress
                })

        for tile in tiles.values():
            if tile.building and tile.building.buildProgress >= 100 and tile.ownerId:
                building = tile.building
                if now - building.lastProduction >= 5:
                    output = BUILDING_OUTPUTS.get(building.type)
                    if output and tile.ownerId in players:
                        owner = players[tile.ownerId]
                        amt = output["amount"] * building.level
                        res_dict = owner.resources.to_dict()
                        res_dict[output["resource"]] += amt
                        owner.resources = Resources(**res_dict)
                        building.lastProduction = now

                        await manager.send_to(tile.ownerId, "production", {
                            "playerId": tile.ownerId,
                            "resource": output["resource"],
                            "amount": amt
                        })
                        await manager.broadcast("resources_updated", {
                            "playerId": tile.ownerId,
                            "resources": owner.resources.to_dict()
                        })
                        await manager.broadcast("tile_updated", tile.to_dict())

        await asyncio.sleep(0.3)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(game_loop())
    for _ in range(3):
        await asyncio.sleep(0.1)
    now = time.time()
    market_orders.extend([
        MarketOrder(id="mock1", sellerId="ai1", sellerName="农场主AI", itemType="food",
                    quantity=50, pricePerUnit=8, isBuyOrder=False, createdAt=now - 10),
        MarketOrder(id="mock2", sellerId="ai2", sellerName="工厂主AI", itemType="iron",
                    quantity=30, pricePerUnit=15, isBuyOrder=False, createdAt=now - 5),
        MarketOrder(id="mock3", sellerId="ai1", sellerName="农场主AI", itemType="wood",
                    quantity=20, pricePerUnit=12, isBuyOrder=True, createdAt=now - 3),
    ])


@app.post("/api/players")
async def create_player(req: CreatePlayerRequest):
    pid = str(uuid.uuid4())
    color = PLAYER_COLORS[len(players) % len(PLAYER_COLORS)]
    player = Player(id=pid, name=req.name, color=color)
    players[pid] = player
    return player.to_dict()


@app.get("/api/players")
def list_players():
    return [p.to_dict() for p in players.values()]


@app.get("/api/players/{player_id}")
def get_player(player_id: str):
    if player_id not in players:
        raise HTTPException(404, "Player not found")
    return players[player_id].to_dict()


@app.post("/api/players/{player_id}/industry")
async def select_industry(player_id: str, req: SelectIndustryRequest):
    if player_id not in players:
        raise HTTPException(404, "Player not found")
    if req.industry not in INDUSTRY_STARTS:
        raise HTTPException(400, "Invalid industry")
    p = players[player_id]
    p.industry = req.industry
    p.resources = Resources(**INDUSTRY_STARTS[req.industry])
    await manager.broadcast("player_updated", p.to_dict())
    return p.to_dict()


@app.get("/api/tiles")
def get_tiles():
    return [t.to_dict() for t in tiles.values()]


@app.post("/api/tiles/{tile_id}/buy")
async def buy_tile(tile_id: str, body: PlayerIdRequest):
    pid = body.playerId
    if tile_id not in tiles or pid not in players:
        raise HTTPException(404, "Not found")
    tile = tiles[tile_id]
    player = players[pid]
    if tile.ownerId or player.resources.money < tile.price:
        raise HTTPException(400, "Cannot buy")
    player.resources.money -= tile.price
    tile.ownerId = pid
    await manager.broadcast("tile_updated", tile.to_dict())
    await manager.broadcast("resources_updated", {
        "playerId": pid, "resources": player.resources.to_dict()
    })
    return tile.to_dict()


@app.post("/api/tiles/{tile_id}/build")
async def build_tile(tile_id: str, body: BuildRequest):
    pid = body.playerId
    bt = body.buildingType
    if tile_id not in tiles or pid not in players:
        raise HTTPException(404, "Not found")
    if bt not in BUILDING_COSTS:
        raise HTTPException(400, "Invalid building type")
    tile = tiles[tile_id]
    player = players[pid]
    if tile.ownerId != pid or tile.building:
        raise HTTPException(400, "Cannot build")
    cost = BUILDING_COSTS[bt]
    for res, amt in cost.items():
        if getattr(player.resources, res, 0) < amt:
            raise HTTPException(400, f"Insufficient {res}")
    for res, amt in cost.items():
        setattr(player.resources, res, getattr(player.resources, res) - amt)
    tile.building = Building(
        id=str(uuid.uuid4()), type=bt, buildProgress=0,
        lastProduction=time.time()
    )
    await manager.broadcast("tile_updated", tile.to_dict())
    await manager.broadcast("resources_updated", {
        "playerId": pid, "resources": player.resources.to_dict()
    })
    return tile.to_dict()


@app.post("/api/tiles/{tile_id}/upgrade")
async def upgrade_tile(tile_id: str, body: PlayerIdRequest):
    pid = body.playerId
    if tile_id not in tiles or pid not in players:
        raise HTTPException(404, "Not found")
    tile = tiles[tile_id]
    player = players[pid]
    if tile.ownerId != pid or not tile.building:
        raise HTTPException(400, "Cannot upgrade")
    upgrade_cost = tile.building.level * 300
    if player.resources.money < upgrade_cost:
        raise HTTPException(400, "Insufficient money")
    player.resources.money -= upgrade_cost
    tile.building.level += 1
    await manager.broadcast("tile_updated", tile.to_dict())
    await manager.broadcast("resources_updated", {
        "playerId": pid, "resources": player.resources.to_dict()
    })
    return tile.to_dict()


@app.get("/api/market")
def get_market():
    return [o.to_dict() for o in sorted(market_orders, key=lambda o: -o.createdAt)]


@app.post("/api/market")
async def create_order(body: CreateOrderRequest):
    pid = body.playerId
    if pid not in players:
        raise HTTPException(404, "Player not found")
    player = players[pid]
    if body.quantity <= 0 or body.pricePerUnit <= 0:
        raise HTTPException(400, "Invalid quantity or price")

    if body.isBuyOrder:
        total_cost = body.quantity * body.pricePerUnit
        if player.resources.money < total_cost:
            raise HTTPException(400, "Insufficient money")
        player.resources.money -= total_cost
    else:
        if getattr(player.resources, body.itemType, 0) < body.quantity:
            raise HTTPException(400, f"Insufficient {body.itemType}")
        setattr(player.resources, body.itemType,
                getattr(player.resources, body.itemType) - body.quantity)

    order = MarketOrder(
        id=str(uuid.uuid4()),
        sellerId=pid,
        sellerName=player.name,
        itemType=body.itemType,
        quantity=body.quantity,
        pricePerUnit=body.pricePerUnit,
        isBuyOrder=body.isBuyOrder,
        createdAt=time.time(),
    )
    market_orders.append(order)

    await manager.broadcast("market_order_created", order.to_dict())
    await manager.broadcast("resources_updated", {
        "playerId": pid, "resources": player.resources.to_dict()
    })
    return order.to_dict()


@app.post("/api/market/{order_id}/accept")
async def accept_order(order_id: str, body: AcceptOrderRequest):
    pid = body.playerId
    order = next((o for o in market_orders if o.id == order_id), None)
    if not order or order.justFilled:
        raise HTTPException(404, "Order not found")
    if order.sellerId == pid:
        raise HTTPException(400, "Cannot accept own order")
    if pid not in players or order.sellerId not in players:
        raise HTTPException(404, "Player not found")

    buyer = players[pid] if not order.isBuyOrder else players[order.sellerId]
    seller = players[order.sellerId] if not order.isBuyOrder else players[pid]

    if order.isBuyOrder:
        if getattr(seller.resources, order.itemType, 0) < order.quantity:
            raise HTTPException(400, f"Insufficient {order.itemType}")
        total = order.quantity * order.pricePerUnit
        setattr(seller.resources, order.itemType,
                getattr(seller.resources, order.itemType) - order.quantity)
        seller.resources.money += total
        setattr(buyer.resources, order.itemType,
                getattr(buyer.resources, order.itemType) + order.quantity)
    else:
        total = order.quantity * order.pricePerUnit
        if buyer.resources.money < total:
            raise HTTPException(400, "Insufficient money")
        buyer.resources.money -= total
        setattr(buyer.resources, order.itemType,
                getattr(buyer.resources, order.itemType) + order.quantity)
        seller.resources.money += total

    order.justFilled = True
    await manager.broadcast("market_order_filled", order.id)
    await manager.broadcast("resources_updated", {
        "playerId": buyer.id, "resources": buyer.resources.to_dict()
    })
    await manager.broadcast("resources_updated", {
        "playerId": seller.id, "resources": seller.resources.to_dict()
    })

    async def remove_order():
        await asyncio.sleep(1.5)
        if order in market_orders:
            market_orders.remove(order)
        await manager.broadcast("market_order_removed", order.id)
    asyncio.create_task(remove_order())

    return {"status": "success", "orderId": order.id}


@app.websocket("/ws/{player_id}")
async def ws_endpoint(ws: WebSocket, player_id: str):
    await manager.connect(player_id, ws)
    try:
        while True:
            try:
                await ws.receive_text()
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(player_id)


if __name__ == "__main__":
    import uvicorn
    print("🚀 商业帝国模拟后端启动于 http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
