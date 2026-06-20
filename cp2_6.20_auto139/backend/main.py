from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import database

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PointCreate(BaseModel):
    name: str
    type: str
    lat: float
    lng: float
    altitude: float
    estimatedArrival: str
    hasWater: Optional[bool] = False
    hasShelter: Optional[bool] = False

class PointUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    altitude: Optional[float] = None
    estimatedArrival: Optional[str] = None
    hasWater: Optional[bool] = None
    hasShelter: Optional[bool] = None

class RouteCreate(BaseModel):
    name: str
    points: List[PointCreate] = []
    totalDistance: float = 0
    estimatedDuration: int = 0

class RouteUpdate(BaseModel):
    name: Optional[str] = None
    totalDistance: Optional[float] = None
    estimatedDuration: Optional[int] = None

class UpdatePositionRequest(BaseModel):
    memberId: str
    routeId: str
    name: str
    lat: float
    lng: float
    status: str

class JoinRouteRequest(BaseModel):
    name: str

@app.get("/api/routes")
async def get_routes():
    return database.get_all_routes()

@app.get("/api/routes/{route_id}")
async def get_route(route_id: str):
    route = database.get_route(route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route

@app.get("/api/routes/code/{code}")
async def get_route_by_code(code: str):
    route = database.get_route_by_code(code)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route

@app.post("/api/routes")
async def create_route(route_data: RouteCreate):
    route = database.create_route(route_data.name)
    for point in route_data.points:
        database.add_point(route['id'], point.model_dump())
    return database.get_route(route['id'])

@app.put("/api/routes/{route_id}")
async def update_route(route_id: str, route_data: RouteUpdate):
    route = database.update_route(route_id, route_data.model_dump(exclude_unset=True))
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route

@app.post("/api/routes/{route_id}/points")
async def add_point(route_id: str, point_data: PointCreate):
    route = database.get_route(route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return database.add_point(route_id, point_data.model_dump())

@app.put("/api/routes/{route_id}/points/{point_id}")
async def update_point(route_id: str, point_id: str, point_data: PointUpdate):
    point = database.update_point(route_id, point_id, point_data.model_dump(exclude_unset=True))
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")
    return point

@app.delete("/api/routes/{route_id}/points/{point_id}")
async def delete_point(route_id: str, point_id: str):
    deleted = database.delete_point(route_id, point_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Point not found")
    return {"message": "Point deleted successfully"}

@app.get("/api/team/{route_id}")
async def get_team(route_id: str):
    return database.get_team_data(route_id)

@app.get("/api/team/{route_id}/members")
async def get_members(route_id: str):
    return database.get_team_members(route_id)

@app.post("/api/team/position")
async def update_position(request: UpdatePositionRequest):
    return database.update_position(
        request.memberId,
        request.routeId,
        request.name,
        request.lat,
        request.lng,
        request.status
    )

@app.post("/api/team/{route_id}/join")
async def join_route(route_id: str, request: JoinRouteRequest):
    route = database.get_route(route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return database.join_route(route_id, request.name)

@app.get("/")
async def root():
    return {"message": "Expedition Tracker API"}
