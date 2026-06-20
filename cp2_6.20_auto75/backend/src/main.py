import random
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid

app = FastAPI(title="Microclimate Monitoring API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SensorData(BaseModel):
    id: str
    name: str
    type: str
    value: float
    unit: str
    status: str
    x: float
    y: float
    lastUpdate: str
    isVirtual: Optional[bool] = False
    virtualRange: Optional[List[float]] = None


class HistoryPoint(BaseModel):
    timestamp: str
    value: float


class RoutePoint(BaseModel):
    x: float
    y: float
    index: Optional[int] = None


class Route(BaseModel):
    id: str
    type: str
    name: str
    color: str
    points: List[RoutePoint]
    duration: int
    comfortIndex: int


class VirtualSensorCreate(BaseModel):
    x: float
    y: float
    min_value: float
    max_value: float


sensor_types = [
    {"type": "temperature", "unit": "°C", "base": 25},
    {"type": "humidity", "unit": "%", "base": 60},
    {"type": "wind", "unit": "m/s", "base": 3},
    {"type": "light", "unit": "lux", "base": 5000},
    {"type": "pm25", "unit": "μg/m³", "base": 35},
]

sensor_names = [
    "北门传感器", "中央花园", "东区别墅", "西区公园",
    "南区广场", "健身区域", "儿童乐园", "停车场入口"
]
positions = [
    {"x": 150, "y": 120},
    {"x": 400, "y": 250},
    {"x": 650, "y": 150},
    {"x": 180, "y": 400},
    {"x": 500, "y": 380},
    {"x": 700, "y": 450},
    {"x": 300, "y": 500},
    {"x": 550, "y": 200},
]


def generate_sensors() -> List[SensorData]:
    sensors = []
    for i, name in enumerate(sensor_names):
        type_info = sensor_types[i % len(sensor_types)]
        sensors.append(SensorData(
            id=str(uuid.uuid4()),
            name=name,
            type=type_info["type"],
            value=round(type_info["base"] + (random.random() - 0.5) * 10, 1),
            unit=type_info["unit"],
            status="online" if random.random() > 0.1 else "warning",
            x=positions[i]["x"],
            y=positions[i]["y"],
            lastUpdate=datetime.now().isoformat(),
        ))
    return sensors


sensors_db = generate_sensors()


def generate_history(sensor_id: str, range_hours: int) -> List[HistoryPoint]:
    points = []
    now = datetime.now()
    total_points = range_hours * 4
    interval = timedelta(minutes=15)

    base_value = 25
    for s in sensors_db:
        if s.id == sensor_id:
            base_value = s.value
            break

    for i in range(total_points, -1, -1):
        timestamp = now - i * interval
        value = base_value + random.uniform(-3, 3) + (i % 8) * 0.3
        points.append(HistoryPoint(
            timestamp=timestamp.isoformat(),
            value=round(value, 2),
        ))
    return points


@app.get("/api/sensors")
async def get_sensors() -> List[SensorData]:
    for sensor in sensors_db:
        sensor.lastUpdate = datetime.now().isoformat()
        if sensor.isVirtual and sensor.virtualRange:
            r = sensor.virtualRange
            sensor.value = round(r[0] + random.random() * (r[1] - r[0]), 1)
        else:
            sensor.value = round(sensor.value + (random.random() - 0.5) * 0.5, 1)
    return sensors_db


@app.get("/api/sensor-history/{sensor_id}")
async def get_sensor_history(sensor_id: str, range: str = "24h") -> List[HistoryPoint]:
    range_map = {
        "1h": 1,
        "6h": 6,
        "24h": 24,
        "7d": 168,
    }
    hours = range_map.get(range, 24)
    return generate_history(sensor_id, hours)


@app.post("/api/virtual-sensor")
async def add_virtual_sensor(data: VirtualSensorCreate) -> SensorData:
    new_sensor = SensorData(
        id=str(uuid.uuid4()),
        name=f"虚拟传感器_{random.randint(100, 999)}",
        type="temperature",
        value=round((data.min_value + data.max_value) / 2, 1),
        unit="°C",
        status="online",
        x=data.x,
        y=data.y,
        lastUpdate=datetime.now().isoformat(),
        isVirtual=True,
        virtualRange=[data.min_value, data.max_value],
    )
    sensors_db.append(new_sensor)
    return new_sensor


@app.post("/api/calculate-routes")
async def calculate_routes(start: RoutePoint, end: RoutePoint) -> List[Route]:
    mid_x = (start.x + end.x) / 2
    mid_y = (start.y + end.y) / 2

    routes = [
        Route(
            id=str(uuid.uuid4()),
            type="shortest",
            name="最短路线",
            color="#3498db",
            points=[
                RoutePoint(x=start.x, y=start.y, index=0),
                RoutePoint(x=mid_x, y=mid_y, index=1),
                RoutePoint(x=end.x, y=end.y, index=2),
            ],
            duration=15,
            comfortIndex=65,
        ),
        Route(
            id=str(uuid.uuid4()),
            type="coolest",
            name="最凉爽路线",
            color="#00d9ff",
            points=[
                RoutePoint(x=start.x, y=start.y, index=0),
                RoutePoint(x=mid_x - 50, y=mid_y + 30, index=1),
                RoutePoint(x=mid_x + 20, y=mid_y + 60, index=2),
                RoutePoint(x=end.x, y=end.y, index=3),
            ],
            duration=22,
            comfortIndex=88,
        ),
        Route(
            id=str(uuid.uuid4()),
            type="comfortable",
            name="最舒适路线",
            color="#ffd700",
            points=[
                RoutePoint(x=start.x, y=start.y, index=0),
                RoutePoint(x=mid_x + 30, y=mid_y - 20, index=1),
                RoutePoint(x=mid_x + 10, y=mid_y + 40, index=2),
                RoutePoint(x=end.x, y=end.y, index=3),
            ],
            duration=18,
            comfortIndex=92,
        ),
    ]
    return routes


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            for sensor in sensors_db:
                if sensor.isVirtual and sensor.virtualRange:
                    r = sensor.virtualRange
                    new_value = round(r[0] + random.random() * (r[1] - r[0]), 1)
                else:
                    new_value = round(sensor.value + (random.random() - 0.5) * 0.8, 1)
                sensor.value = new_value
                sensor.lastUpdate = datetime.now().isoformat()

                await manager.broadcast({
                    "type": "sensor_update",
                    "sensor": sensor.dict(),
                    "timestamp": datetime.now().isoformat(),
                })

            await asyncio.sleep(3)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/api/aqi")
async def get_aqi():
    return {"value": random.randint(30, 120), "level": "良"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
