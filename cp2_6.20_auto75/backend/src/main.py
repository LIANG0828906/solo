import random
import asyncio
import math
import heapq
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Tuple
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid

app = FastAPI(
    title="Microclimate Monitoring API",
    description="微气候环境监测系统后端API",
    version="1.0.0"
)

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


class RouteCalculateRequest(BaseModel):
    start: RoutePoint
    end: RoutePoint


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

MAP_WIDTH = 800
MAP_HEIGHT = 600
GRID_SIZE = 20


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


sensors_db: List[SensorData] = generate_sensors()
sensor_trends: Dict[str, float] = {}


def smooth_random_walk(current_value: float, volatility: float = 0.3, min_val: float = 0, max_val: float = 100) -> float:
    if current_value not in sensor_trends:
        sensor_trends[str(current_value)] = random.uniform(-0.1, 0.1)

    trend = sensor_trends.get(str(current_value), 0)
    trend += random.uniform(-0.05, 0.05)
    trend = max(-0.5, min(0.5, trend))

    change = random.gauss(trend, volatility)
    new_value = current_value + change

    if new_value < min_val or new_value > max_val:
        trend = -trend
        new_value = current_value + random.gauss(-trend, volatility)

    sensor_trends[str(current_value)] = trend
    return max(min_val, min(max_val, new_value))


def get_temperature_at(x: float, y: float, sensors: List[SensorData]) -> float:
    total_weight = 0
    total_value = 0

    for sensor in sensors:
        if sensor.type != "temperature":
            continue
        dx = x - sensor.x
        dy = y - sensor.y
        distance = math.sqrt(dx * dx + dy * dy)
        radius = 200
        if distance < radius:
            weight = (1 - distance / radius) ** 2
            total_value += sensor.value * weight
            total_weight += weight

    if total_weight > 0:
        return total_value / total_weight
    return 25


def get_humidity_at(x: float, y: float, sensors: List[SensorData]) -> float:
    total_weight = 0
    total_value = 0

    for sensor in sensors:
        if sensor.type != "humidity":
            continue
        dx = x - sensor.x
        dy = y - sensor.y
        distance = math.sqrt(dx * dx + dy * dy)
        radius = 200
        if distance < radius:
            weight = (1 - distance / radius) ** 2
            total_value += sensor.value * weight
            total_weight += weight

    if total_weight > 0:
        return total_value / total_weight
    return 60


def generate_smooth_route(start: RoutePoint, end: RoutePoint, waypoints: List[Tuple[float, float]] = None) -> List[RoutePoint]:
    points = [RoutePoint(x=start.x, y=start.y, index=0)]

    if waypoints:
        for i, (wx, wy) in enumerate(waypoints):
            points.append(RoutePoint(x=wx, y=wy, index=i + 1))

    points.append(RoutePoint(x=end.x, y=end.y, index=len(points)))
    return points


def dijkstra_route(start: RoutePoint, end: RoutePoint, sensors: List[SensorData], weight_func) -> List[RoutePoint]:
    cols = MAP_WIDTH // GRID_SIZE
    rows = MAP_HEIGHT // GRID_SIZE

    start_col = int(max(0, min(cols - 1, start.x // GRID_SIZE)))
    start_row = int(max(0, min(rows - 1, start.y // GRID_SIZE)))
    end_col = int(max(0, min(cols - 1, end.x // GRID_SIZE)))
    end_row = int(max(0, min(rows - 1, end.y // GRID_SIZE)))

    heap = [(0, start_col, start_row)]
    distances = {(start_col, start_row): 0}
    came_from = {}

    directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]

    while heap:
        dist, col, row = heapq.heappop(heap)

        if col == end_col and row == end_row:
            break

        if dist > distances.get((col, row), float('inf')):
            continue

        for dc, dr in directions:
            new_col, new_row = col + dc, row + dr
            if 0 <= new_col < cols and 0 <= new_row < rows:
                wx = new_col * GRID_SIZE + GRID_SIZE / 2
                wy = new_row * GRID_SIZE + GRID_SIZE / 2

                step_cost = weight_func(wx, wy, sensors)
                step_dist = math.sqrt(dc * dc + dr * dr) * GRID_SIZE
                new_dist = dist + step_cost * step_dist

                if new_dist < distances.get((new_col, new_row), float('inf')):
                    distances[(new_col, new_row)] = new_dist
                    came_from[(new_col, new_row)] = (col, row)
                    heapq.heappush(heap, (new_dist, new_col, new_row))

    path = []
    current = (end_col, end_row)
    while current in came_from:
        col, row = current
        path.append(RoutePoint(
            x=col * GRID_SIZE + GRID_SIZE / 2,
            y=row * GRID_SIZE + GRID_SIZE / 2
        ))
        current = came_from[current]

    path.reverse()

    if len(path) > 6:
        step = len(path) // 4
        simplified = [path[0]]
        for i in range(step, len(path) - 1, step):
            simplified.append(path[i])
        simplified.append(path[-1])
        for i, p in enumerate(simplified):
            p.index = i
        return simplified

    result = [RoutePoint(x=start.x, y=start.y, index=0)]
    for i, p in enumerate(path):
        p.index = i + 1
        result.append(p)
    return result


def shortest_weight(x: float, y: float, sensors: List[SensorData]) -> float:
    return 1.0


def coolest_weight(x: float, y: float, sensors: List[SensorData]) -> float:
    temp = get_temperature_at(x, y, sensors)
    humidity = get_humidity_at(x, y, sensors)
    discomfort = (temp - 20) * 0.8 + max(0, humidity - 60) * 0.5
    return max(0.2, 1 + discomfort * 0.15)


def comfortable_weight(x: float, y: float, sensors: List[SensorData]) -> float:
    temp = get_temperature_at(x, y, sensors)
    humidity = get_humidity_at(x, y, sensors)
    temp_penalty = abs(temp - 23) * 0.6
    humidity_penalty = abs(humidity - 55) * 0.4
    return max(0.2, 1 + (temp_penalty + humidity_penalty) * 0.08)


@app.get("/api/sensors", response_model=List[SensorData])
async def get_sensors() -> List[SensorData]:
    for sensor in sensors_db:
        sensor.lastUpdate = datetime.now().isoformat()
        if sensor.isVirtual and sensor.virtualRange:
            r = sensor.virtualRange
            mid = (r[0] + r[1]) / 2
            sensor.value = round(smooth_random_walk(
                sensor.value if sensor.value != mid else mid,
                volatility=0.5,
                min_val=r[0],
                max_val=r[1]
            ), 1)
        else:
            min_v = 10 if sensor.type == "temperature" else 0
            max_v = 40 if sensor.type == "temperature" else (100 if sensor.type == "humidity" else 99999)
            sensor.value = round(smooth_random_walk(
                sensor.value,
                volatility=0.25,
                min_val=min_v,
                max_val=max_v
            ), 1)
    return sensors_db


@app.get("/api/sensor-history/{sensor_id}", response_model=List[HistoryPoint])
async def get_sensor_history(sensor_id: str, range: str = "24h") -> List[HistoryPoint]:
    range_map = {
        "1h": 6,
        "6h": 12,
        "24h": 24,
        "7d": 168,
    }
    hours = range_map.get(range, 24)
    total_points = hours
    data = []
    now = datetime.now()

    base_value = 25
    for s in sensors_db:
        if s.id == sensor_id:
            base_value = s.value
            break

    interval = timedelta(minutes=(24 * 60) // max(1, total_points))
    for i in range(total_points, -1, -1):
        timestamp = now - i * interval
        hour_factor = math.sin(i / 4) * 2
        value = base_value + random.uniform(-2, 2) + hour_factor + (i % 6) * 0.2
        data.append(HistoryPoint(
            timestamp=timestamp.isoformat(),
            value=round(max(0, value), 2),
        ))
    return data


@app.post("/api/virtual-sensor", response_model=SensorData)
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


@app.post("/api/calculate-routes", response_model=List[Route])
async def calculate_routes(request: RouteCalculateRequest) -> List[Route]:
    start = request.start
    end = request.end

    shortest_waypoints = dijkstra_route(start, end, sensors_db, shortest_weight)
    coolest_waypoints = dijkstra_route(start, end, sensors_db, coolest_weight)
    comfortable_waypoints = dijkstra_route(start, end, sensors_db, comfortable_weight)

    def calc_distance(points: List[RoutePoint]) -> float:
        dist = 0
        for i in range(1, len(points)):
            dist += math.sqrt(
                (points[i].x - points[i - 1].x) ** 2 +
                (points[i].y - points[i - 1].y) ** 2
            )
        return dist

    shortest_dist = calc_distance(shortest_waypoints)

    routes = [
        Route(
            id=str(uuid.uuid4()),
            type="shortest",
            name="最短路线",
            color="#3498db",
            points=shortest_waypoints,
            duration=max(5, int(shortest_dist / 80)),
            comfortIndex=65,
        ),
        Route(
            id=str(uuid.uuid4()),
            type="coolest",
            name="最凉爽路线",
            color="#00d9ff",
            points=coolest_waypoints,
            duration=max(8, int(shortest_dist / 60)),
            comfortIndex=88,
        ),
        Route(
            id=str(uuid.uuid4()),
            type="comfortable",
            name="最舒适路线",
            color="#ffd700",
            points=comfortable_waypoints,
            duration=max(6, int(shortest_dist / 70)),
            comfortIndex=92,
        ),
    ]
    return routes


@app.get("/api/aqi")
async def get_aqi():
    return {
        "value": int(smooth_random_walk(72, volatility=5, min_val=20, max_val=180)),
        "level": "良",
        "timestamp": datetime.now().isoformat()
    }


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            for sensor in sensors_db:
                if sensor.isVirtual and sensor.virtualRange:
                    r = sensor.virtualRange
                    new_value = round(smooth_random_walk(
                        sensor.value,
                        volatility=0.4,
                        min_val=r[0],
                        max_val=r[1]
                    ), 1)
                else:
                    min_v = 10 if sensor.type == "temperature" else 0
                    max_v = 40 if sensor.type == "temperature" else (100 if sensor.type == "humidity" else 99999)
                    new_value = round(smooth_random_walk(
                        sensor.value,
                        volatility=0.2,
                        min_val=min_v,
                        max_val=max_v
                    ), 1)
                sensor.value = new_value
                sensor.lastUpdate = datetime.now().isoformat()

                await manager.broadcast({
                    "type": "sensor_update",
                    "sensor": sensor.model_dump(),
                    "timestamp": datetime.now().isoformat(),
                })

            aqi_data = await get_aqi()
            await manager.broadcast({
                "type": "aqi_update",
                "data": aqi_data,
                "timestamp": datetime.now().isoformat(),
            })

            await asyncio.sleep(3)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/")
async def root():
    return {
        "message": "Microclimate Monitoring API",
        "version": "1.0.0",
        "endpoints": {
            "sensors": "/api/sensors",
            "sensor_history": "/api/sensor-history/{sensor_id}",
            "virtual_sensor": "/api/virtual-sensor",
            "calculate_routes": "/api/calculate-routes",
            "aqi": "/api/aqi",
            "websocket": "/ws"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
