from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import random
import asyncio
from datetime import datetime

app = FastAPI(title="智能码头调度模拟器 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SHIP_NAMES = ['远洋号', '蓝鲸号', '东方之星', '海鸥号', '胜利号', '巨鲸号', '致远号', '腾飞号']
DESTINATIONS = ['上海', '深圳', '新加坡', '鹿特丹', '洛杉矶', '东京', '釜山', '汉堡']
OWNERS = ['中远海运', '马士基', '地中海航运', '赫伯罗特', '达飞海运', '中远集运']
CONTAINER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e']


class Ship(BaseModel):
    id: str
    name: str
    containerCount: int
    berthingDuration: int
    draft: float
    berthId: Optional[str] = None
    status: str = 'approaching'
    position: Dict[str, float]
    loadedContainers: int = 0
    arrivalTime: float = 0
    dockedTime: Optional[float] = None
    departureTime: Optional[float] = None


class Berth(BaseModel):
    id: str
    name: str
    type: str
    depth: float
    position: Dict[str, Any]
    shipId: Optional[str] = None
    cranes: List[str] = []
    yardColumnIds: List[str] = []


class Container(BaseModel):
    id: str
    color: str
    destination: str
    weight: int
    size: str
    owner: str


class YardColumn(BaseModel):
    id: str
    berthId: str
    position: Dict[str, Any]
    containers: List[Optional[Container]]
    maxHeight: int = 4


class Crane(BaseModel):
    id: str
    berthId: str
    position: Dict[str, float]
    targetX: Optional[float] = None
    status: str = 'idle'
    carriedContainer: Optional[Container] = None
    currentColumnId: Optional[str] = None


class SimulationState(BaseModel):
    simulationTime: float = 0
    speed: float = 1
    isRunning: bool = False
    ships: List[Ship] = []
    berthes: List[Berth] = []
    yardColumns: List[YardColumn] = []
    cranes: List[Crane] = []
    stats: Dict[str, Any] = {}
    berthEfficiencies: List[Dict[str, Any]] = []
    history: List[Dict[str, Any]] = []
    suggestion: Optional[str] = None


def generate_container() -> Container:
    return Container(
        id=str(uuid.uuid4()),
        color=random.choice(CONTAINER_COLORS),
        destination=random.choice(DESTINATIONS),
        weight=random.randint(5000, 25000),
        size='40ft' if random.random() > 0.5 else '20ft',
        owner=random.choice(OWNERS),
    )


def create_initial_state() -> SimulationState:
    berthes: List[Berth] = []
    berth_configs = [
        {'name': '1号泊位', 'type': 'deep', 'depth': 15, 'y': 80},
        {'name': '2号泊位', 'type': 'deep', 'depth': 14, 'y': 180},
        {'name': '3号泊位', 'type': 'shallow', 'depth': 10, 'y': 280},
        {'name': '4号泊位', 'type': 'shallow', 'depth': 9, 'y': 380},
        {'name': '5号泊位', 'type': 'maintenance', 'depth': 8, 'y': 480},
    ]

    for i, config in enumerate(berth_configs):
        berth_id = f'berth-{i + 1}'
        berthes.append(Berth(
            id=berth_id,
            name=config['name'],
            type=config['type'],
            depth=config['depth'],
            position={'x': 200, 'y': config['y'], 'width': 180, 'height': 80},
            cranes=[],
            yardColumnIds=[f'yard-{berth_id}-1', f'yard-{berth_id}-2', f'yard-{berth_id}-3'],
        ))

    yard_columns: List[YardColumn] = []
    for berth in berthes:
        for col_index, col_id in enumerate(berth.yardColumnIds):
            containers: List[Optional[Container]] = []
            initial_count = random.randint(1, 3)
            for i in range(4):
                if i < initial_count:
                    containers.append(generate_container())
                else:
                    containers.append(None)
            yard_columns.append(YardColumn(
                id=col_id,
                berthId=berth.id,
                position={
                    'x': 420 + col_index * 70,
                    'y': berth.position['y'] + 10,
                    'width': 60,
                },
                containers=containers,
                maxHeight=4,
            ))

    cranes: List[Crane] = []
    crane_index = 1
    for berth in berthes[:3]:
        for i in range(2):
            cranes.append(Crane(
                id=f'crane-{crane_index}',
                berthId=berth.id,
                position={'x': 250 + i * 50, 'y': berth.position['y'] + 40},
                status='idle',
            ))
            crane_index += 1

    return SimulationState(
        berthes=berthes,
        yardColumns=yard_columns,
        cranes=cranes,
        stats={
            'shipsInPort': 0,
            'usedBerthes': 0,
            'totalBerthes': len(berthes),
            'yardOccupancy': 0,
            'avgLoadingTime': 45,
            'totalContainersLoaded': 0,
            'totalContainers': 0,
            'loadingEfficiency': 0,
        },
    )


state = create_initial_state()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass


manager = ConnectionManager()


def generate_ship() -> Ship:
    name = random.choice(SHIP_NAMES)
    draft = random.uniform(6, 14)
    return Ship(
        id=str(uuid.uuid4()),
        name=name,
        containerCount=random.randint(20, 70),
        berthingDuration=random.randint(60, 180),
        draft=draft,
        status='approaching',
        position={'x': -100, 'y': 100 + random.random() * 300},
        loadedContainers=0,
        arrivalTime=state.simulationTime,
    )


def calculate_stats():
    active_ships = [s for s in state.ships if s.status != 'departed']
    used_berthes = len([b for b in state.berthes if b.shipId])

    total_slots = sum(col.maxHeight for col in state.yardColumns)
    used_slots = sum(len([c for c in col.containers if c]) for col in state.yardColumns)

    docked_ships = [s for s in state.ships if s.status in ('docked', 'loading')]
    total_ship_containers = sum(s.containerCount for s in docked_ships)
    loaded_containers = sum(s.loadedContainers for s in docked_ships)

    efficiency = 0
    if total_ship_containers > 0:
        efficiency = round((loaded_containers / total_ship_containers) * 100)

    efficiencies = []
    for berth in state.berthes:
        efficiencies.append({
            'berthId': berth.id,
            'berthName': berth.name,
            'workDuration': random.randint(0, 3600) if berth.shipId else 0,
            'liftCount': random.randint(0, 100) if berth.shipId else 0,
        })

    state.stats = {
        'shipsInPort': len(active_ships),
        'usedBerthes': used_berthes,
        'totalBerthes': len(state.berthes),
        'yardOccupancy': round((used_slots / total_slots) * 100) if total_slots > 0 else 0,
        'avgLoadingTime': 45,
        'totalContainersLoaded': state.stats.get('totalContainersLoaded', 0),
        'totalContainers': total_ship_containers,
        'loadingEfficiency': efficiency,
    }
    state.berthEfficiencies = efficiencies


@app.get("/api/state")
async def get_state():
    return state.model_dump()


@app.get("/api/ships")
async def get_ships():
    return {"ships": [s.model_dump() for s in state.ships]}


@app.post("/api/ships")
async def create_ship():
    active_count = len([s for s in state.ships if s.status != 'departed'])
    if active_count >= 5:
        raise HTTPException(status_code=400, detail="Maximum active ships reached")
    
    ship = generate_ship()
    state.ships.append(ship)
    state.history.append({
        'timestamp': datetime.now().timestamp(),
        'type': 'ship_arrival',
        'data': {'shipId': ship.id, 'shipName': ship.name},
    })
    calculate_stats()
    
    await manager.broadcast({
        'type': 'ship_arrival',
        'ship': ship.model_dump(),
    })
    
    return ship.model_dump()


@app.post("/api/ships/{ship_id}/dock")
async def dock_ship(ship_id: str, berth_id: str):
    ship = next((s for s in state.ships if s.id == ship_id), None)
    berth = next((b for b in state.berthes if b.id == berth_id), None)
    
    if not ship or not berth:
        raise HTTPException(status_code=404, detail="Ship or berth not found")
    
    if berth.shipId:
        raise HTTPException(status_code=400, detail="Berth already occupied")
    
    if berth.type == 'maintenance':
        raise HTTPException(status_code=400, detail="Maintenance berth cannot be used")
    
    if berth.depth < ship.draft:
        raise HTTPException(status_code=400, detail="Insufficient water depth")
    
    ship.berthId = berth_id
    ship.status = 'docked'
    ship.position = {'x': berth.position['x'] + 20, 'y': berth.position['y'] + 10}
    ship.dockedTime = state.simulationTime
    berth.shipId = ship_id
    
    calculate_stats()
    
    await manager.broadcast({
        'type': 'ship_docked',
        'shipId': ship_id,
        'berthId': berth_id,
    })
    
    return {"success": True}


@app.post("/api/ships/{ship_id}/depart")
async def depart_ship(ship_id: str):
    ship = next((s for s in state.ships if s.id == ship_id), None)
    if not ship or not ship.berthId:
        raise HTTPException(status_code=404, detail="Ship not found or not docked")
    
    berth = next((b for b in state.berthes if b.id == ship.berthId), None)
    if berth:
        berth.shipId = None
    
    ship.status = 'departed'
    ship.departureTime = state.simulationTime
    ship.position = {'x': 1000, 'y': ship.position['y']}
    
    state.history.append({
        'timestamp': datetime.now().timestamp(),
        'type': 'ship_departure',
        'data': {'shipId': ship_id, 'shipName': ship.name},
    })
    
    calculate_stats()
    
    await manager.broadcast({
        'type': 'ship_departed',
        'shipId': ship_id,
    })
    
    return {"success": True}


@app.get("/api/berthes")
async def get_berthes():
    return {"berthes": [b.model_dump() for b in state.berthes]}


@app.get("/api/yard-columns")
async def get_yard_columns():
    return {"columns": [c.model_dump() for c in state.yardColumns]}


@app.get("/api/cranes")
async def get_cranes():
    return {"cranes": [c.model_dump() for c in state.cranes]}


@app.post("/api/cranes/{crane_id}/move")
async def move_crane(crane_id: str, targetX: float):
    crane = next((c for c in state.cranes if c.id == crane_id), None)
    if not crane:
        raise HTTPException(status_code=404, detail="Crane not found")
    
    crane.status = 'moving'
    crane.targetX = targetX
    
    await manager.broadcast({
        'type': 'crane_move',
        'craneId': crane_id,
        'targetX': targetX,
    })
    
    return {"success": True}


@app.post("/api/cranes/{crane_id}/grab")
async def grab_container(crane_id: str, columnId: str):
    crane = next((c for c in state.cranes if c.id == crane_id), None)
    column = next((c for c in state.yardColumns if c.id == columnId), None)
    
    if not crane or not column:
        raise HTTPException(status_code=404, detail="Crane or column not found")
    
    if crane.carriedContainer:
        raise HTTPException(status_code=400, detail="Crane already carrying container")
    
    top_container_idx = next((i for i, c in enumerate(column.containers) if c), -1)
    if top_container_idx == -1:
        raise HTTPException(status_code=400, detail="No containers in column")
    
    container = column.containers[top_container_idx]
    column.containers[top_container_idx] = None
    
    crane.status = 'grabbing'
    crane.carriedContainer = container
    
    state.history.append({
        'timestamp': datetime.now().timestamp(),
        'type': 'container_move',
        'data': {'craneId': crane_id, 'columnId': columnId, 'containerId': container.id if container else ''},
    })
    
    calculate_stats()
    
    await manager.broadcast({
        'type': 'container_grabbed',
        'craneId': crane_id,
        'columnId': columnId,
    })
    
    return {"success": True}


@app.post("/api/cranes/{crane_id}/place")
async def place_container(crane_id: str, shipId: str):
    crane = next((c for c in state.cranes if c.id == crane_id), None)
    ship = next((s for s in state.ships if s.id == shipId), None)
    
    if not crane or not ship:
        raise HTTPException(status_code=404, detail="Crane or ship not found")
    
    if not crane.carriedContainer:
        raise HTTPException(status_code=400, detail="Crane not carrying container")
    
    if ship.loadedContainers >= ship.containerCount:
        raise HTTPException(status_code=400, detail="Ship is full")
    
    ship.loadedContainers += 1
    crane.carriedContainer = None
    crane.status = 'idle'
    
    state.stats['totalContainersLoaded'] = state.stats.get('totalContainersLoaded', 0) + 1
    
    state.history.append({
        'timestamp': datetime.now().timestamp(),
        'type': 'container_move',
        'data': {'craneId': crane_id, 'shipId': shipId},
    })
    
    calculate_stats()
    
    await manager.broadcast({
        'type': 'container_placed',
        'craneId': crane_id,
        'shipId': shipId,
    })
    
    return {"success": True}


@app.get("/api/stats")
async def get_stats():
    return state.stats


@app.get("/api/history")
async def get_history(limit: int = 100):
    return {"history": state.history[-limit:]}


@app.get("/api/suggestion")
async def get_suggestion():
    suggestions = [
        '建议将4号岸桥移至B堆场加快作业',
        '2号泊位装船效率较高，可优先分配船舶',
        '1号堆场集装箱堆积较多，建议加快装船',
        '注意3号泊位水深限制，大型船舶请勿停靠',
        '当前岸桥利用率偏低，可增加作业船舶',
    ]
    return {"suggestion": random.choice(suggestions)}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json({
            'type': 'state_update',
            'state': state.model_dump(),
        })
        
        while True:
            data = await websocket.receive_json()
            action = data.get('action')
            
            if action == 'toggle_simulation':
                state.isRunning = not state.isRunning
                await manager.broadcast({
                    'type': 'simulation_toggled',
                    'isRunning': state.isRunning,
                })
            elif action == 'set_speed':
                state.speed = data.get('speed', 1)
                await manager.broadcast({
                    'type': 'speed_changed',
                    'speed': state.speed,
                })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.post("/api/simulation/start")
async def start_simulation():
    state.isRunning = True
    await manager.broadcast({'type': 'simulation_started'})
    return {"success": True}


@app.post("/api/simulation/stop")
async def stop_simulation():
    state.isRunning = False
    await manager.broadcast({'type': 'simulation_stopped'})
    return {"success": True}


@app.post("/api/simulation/speed")
async def set_simulation_speed(speed: float):
    state.speed = speed
    await manager.broadcast({'type': 'speed_changed', 'speed': speed})
    return {"success": True}


@app.get("/")
async def root():
    return {"message": "智能码头调度模拟器 API", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
