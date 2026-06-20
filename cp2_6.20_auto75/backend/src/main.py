import random
import asyncio
import math
import heapq
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Tuple, Set
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
ROAD_CELL_SIZE = 40


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
    key = str(current_value) + "_trend"
    if key not in sensor_trends:
        sensor_trends[key] = random.uniform(-0.1, 0.1)

    trend = sensor_trends.get(key, 0)
    trend += random.uniform(-0.05, 0.05)
    trend = max(-0.5, min(0.5, trend))

    change = random.gauss(trend, volatility)
    new_value = current_value + change

    if new_value < min_val or new_value > max_val:
        trend = -trend
        new_value = current_value + random.gauss(-trend, volatility)

    sensor_trends[key] = trend
    return max(min_val, min(max_val, new_value))


def gaussian_kernel(dx: float, dy: float, sigma: float) -> float:
    d2 = dx * dx + dy * dy
    sigma2 = sigma * sigma
    return math.exp(-d2 / (2 * sigma2)) / (2 * math.pi * sigma2)


def get_temperature_at(x: float, y: float, sensors: List[SensorData]) -> float:
    total_weight = 0.0
    total_value = 0.0
    sigma = 100

    for sensor in sensors:
        if sensor.type != "temperature":
            continue
        dx = x - sensor.x
        dy = y - sensor.y
        weight = gaussian_kernel(dx, dy, sigma)
        total_value += sensor.value * weight
        total_weight += weight

    if total_weight > 0:
        return total_value / total_weight
    return 25.0


def get_humidity_at(x: float, y: float, sensors: List[SensorData]) -> float:
    total_weight = 0.0
    total_value = 0.0
    sigma = 100

    for sensor in sensors:
        if sensor.type != "humidity":
            continue
        dx = x - sensor.x
        dy = y - sensor.y
        weight = gaussian_kernel(dx, dy, sigma)
        total_value += sensor.value * weight
        total_weight += weight

    if total_weight > 0:
        return total_value / total_weight
    return 60.0


class RoadNetworkGraph:
    def __init__(self, width: int = MAP_WIDTH, height: int = MAP_HEIGHT, cell_size: int = ROAD_CELL_SIZE):
        self.width = width
        self.height = height
        self.cell_size = cell_size
        self.cols = width // cell_size
        self.rows = height // cell_size
        self.nodes: Dict[Tuple[int, int], Tuple[float, float]] = {}
        self.adjacency: Dict[Tuple[int, int], List[Tuple[Tuple[int, int], float]]] = {}
        self._build_nodes()
        self._build_edges()

    def _is_valid_node(self, col: int, row: int) -> bool:
        if col < 0 or col >= self.cols or row < 0 or row >= self.rows:
            return False
        x = col * self.cell_size + self.cell_size / 2
        y = row * self.cell_size + self.cell_size / 2
        obstacles = [
            (550, 80, 100, 80),
            (280, 440, 120, 100),
        ]
        for ox, oy, ow, oh in obstacles:
            if ox <= x <= ox + ow and oy <= y <= oy + oh:
                return False
        building_centers = [(100, 80, 35), (700, 530, 40)]
        for bx, by, br in building_centers:
            if math.sqrt((x - bx) ** 2 + (y - by) ** 2) < br:
                return False
        return True

    def _build_nodes(self):
        for row in range(self.rows):
            for col in range(self.cols):
                if self._is_valid_node(col, row):
                    x = col * self.cell_size + self.cell_size / 2
                    y = row * self.cell_size + self.cell_size / 2
                    self.nodes[(col, row)] = (x, y)
                    self.adjacency[(col, row)] = []

    def _build_edges(self):
        directions = [
            (-1, 0), (1, 0), (0, -1), (0, 1),
            (-1, -1), (-1, 1), (1, -1), (1, 1)
        ]
        for (col, row) in self.nodes:
            for dc, dr in directions:
                neighbor = (col + dc, row + dr)
                if neighbor in self.nodes:
                    x1, y1 = self.nodes[(col, row)]
                    x2, y2 = self.nodes[neighbor]
                    distance = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
                    self.adjacency[(col, row)].append((neighbor, distance))

    def get_node_coords(self, node_key: Tuple[int, int]) -> Tuple[float, float]:
        return self.nodes[node_key]

    def find_nearest_node(self, x: float, y: float) -> Tuple[int, int]:
        col = max(0, min(self.cols - 1, int(x // self.cell_size)))
        row = max(0, min(self.rows - 1, int(y // self.cell_size)))
        key = (col, row)
        if key in self.nodes:
            return key
        best_key = None
        best_dist = float('inf')
        for (nc, nr) in self.nodes:
            nx, ny = self.nodes[(nc, nr)]
            dist = math.sqrt((x - nx) ** 2 + (y - ny) ** 2)
            if dist < best_dist:
                best_dist = dist
                best_key = (nc, nr)
        return best_key if best_key else (0, 0)

    def dijkstra(self, start_key: Tuple[int, int], end_key: Tuple[int, int],
                  sensors: List[SensorData], weight_func) -> List[Tuple[int, int]]:
        if start_key not in self.nodes or end_key not in self.nodes:
            return []

        distances: Dict[Tuple[int, int], float] = {start_key: 0}
        came_from: Dict[Tuple[int, int], Optional[Tuple[int, int]]] = {start_key: None}
        pq: List[Tuple[float, Tuple[int, int]]] = [(0, start_key)]
        visited: Set[Tuple[int, int]] = set()

        while pq:
            current_dist, current_key = heapq.heappop(pq)

            if current_key in visited:
                continue
            visited.add(current_key)

            if current_key == end_key:
                break

            for neighbor_key, edge_distance in self.adjacency[current_key]:
                nx, ny = self.nodes[neighbor_key]
                weight = weight_func(nx, ny, sensors)
                new_dist = current_dist + edge_distance * weight

                if new_dist < distances.get(neighbor_key, float('inf')):
                    distances[neighbor_key] = new_dist
                    came_from[neighbor_key] = current_key
                    heapq.heappush(pq, (new_dist, neighbor_key))

        if end_key not in came_from:
            return []

        path: List[Tuple[int, int]] = []
        current: Optional[Tuple[int, int]] = end_key
        while current is not None:
            path.append(current)
            current = came_from[current]
        path.reverse()
        return path

    def simplify_path(self, path: List[Tuple[int, int]]) -> List[Tuple[int, int]]:
        if len(path) <= 6:
            return path
        step = max(1, len(path) // 5)
        simplified = [path[0]]
        for i in range(step, len(path) - 1, step):
            simplified.append(path[i])
        simplified.append(path[-1])
        return simplified


road_graph = RoadNetworkGraph()


def shortest_weight(x: float, y: float, sensors: List[SensorData]) -> float:
    return 1.0


def coolest_weight(x: float, y: float, sensors: List[SensorData]) -> float:
    temp = get_temperature_at(x, y, sensors)
    humidity = get_humidity_at(x, y, sensors)
    discomfort = max(0, temp - 22) * 1.2 + max(0, humidity - 65) * 0.8
    return max(0.2, 1.0 + discomfort * 0.12)


def comfortable_weight(x: float, y: float, sensors: List[SensorData]) -> float:
    temp = get_temperature_at(x, y, sensors)
    humidity = get_humidity_at(x, y, sensors)
    temp_penalty = abs(temp - 23) * 0.7
    humidity_penalty = abs(humidity - 55) * 0.4
    return max(0.2, 1.0 + (temp_penalty + humidity_penalty) * 0.07)


def node_keys_to_route_points(path_keys: List[Tuple[int, int]]) -> List[RoutePoint]:
    points = []
    for i, key in enumerate(path_keys):
        x, y = road_graph.get_node_coords(key)
        points.append(RoutePoint(x=x, y=y, index=i))
    return points


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

    base_value = 25.0
    for s in sensors_db:
        if s.id == sensor_id:
            base_value = float(s.value)
            break

    interval = timedelta(minutes=max(15, (24 * 60) // max(1, total_points)))
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

    start_key = road_graph.find_nearest_node(start.x, start.y)
    end_key = road_graph.find_nearest_node(end.x, end.y)

    shortest_path_keys = road_graph.dijkstra(start_key, end_key, sensors_db, shortest_weight)
    coolest_path_keys = road_graph.dijkstra(start_key, end_key, sensors_db, coolest_weight)
    comfortable_path_keys = road_graph.dijkstra(start_key, end_key, sensors_db, comfortable_weight)

    shortest_simplified = road_graph.simplify_path(shortest_path_keys) if shortest_path_keys else []
    coolest_simplified = road_graph.simplify_path(coolest_path_keys) if coolest_path_keys else []
    comfortable_simplified = road_graph.simplify_path(comfortable_path_keys) if comfortable_path_keys else []

    def calc_distance(points: List[RoutePoint]) -> float:
        dist = 0.0
        for i in range(1, len(points)):
            dist += math.sqrt(
                (points[i].x - points[i - 1].x) ** 2 +
                (points[i].y - points[i - 1].y) ** 2
            )
        return dist

    def build_fallback_route(sx: float, sy: float, ex: float, ey: float) -> List[RoutePoint]:
        mid_x = (sx + ex) / 2
        mid_y = (sy + ey) / 2
        return [
            RoutePoint(x=sx, y=sy, index=0),
            RoutePoint(x=mid_x, y=mid_y, index=1),
            RoutePoint(x=ex, y=ey, index=2),
        ]

    shortest_points = node_keys_to_route_points(shortest_simplified) if shortest_simplified else build_fallback_route(start.x, start.y, end.x, end.y)
    coolest_points = node_keys_to_route_points(coolest_simplified) if coolest_simplified else build_fallback_route(start.x - 30, start.y + 40, end.x, end.y)
    comfortable_points = node_keys_to_route_points(comfortable_simplified) if comfortable_simplified else build_fallback_route(start.x + 20, start.y - 20, end.x, end.y)

    shortest_dist = calc_distance(shortest_points)

    routes = [
        Route(
            id=str(uuid.uuid4()),
            type="shortest",
            name="最短路线",
            color="#3498db",
            points=shortest_points,
            duration=max(5, int(shortest_dist / 80)),
            comfortIndex=65,
        ),
        Route(
            id=str(uuid.uuid4()),
            type="coolest",
            name="最凉爽路线",
            color="#00d9ff",
            points=coolest_points,
            duration=max(8, int(shortest_dist / 60)),
            comfortIndex=88,
        ),
        Route(
            id=str(uuid.uuid4()),
            type="comfortable",
            name="最舒适路线",
            color="#ffd700",
            points=comfortable_points,
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


@app.get("/api/road-network/info")
async def get_road_network_info():
    return {
        "nodes": len(road_graph.nodes),
        "edges": sum(len(e) for e in road_graph.adjacency.values()) // 2,
        "cols": road_graph.cols,
        "rows": road_graph.rows,
        "cell_size": road_graph.cell_size,
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
            "road_network_info": "/api/road-network/info",
            "websocket": "/ws"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
