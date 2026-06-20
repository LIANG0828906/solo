from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import database
from database import (
    init_db,
    create_route,
    get_all_routes,
    get_route,
    get_route_by_code,
    update_route,
    add_route_point,
    update_route_point,
    delete_route_point,
    add_team_member,
    get_team_members,
    update_member_position,
    recalc_route_stats,
    find_nearest_point,
    calculate_member_progress,
    get_route_points,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('startup')
def startup():
    init_db()


class PointCreate(BaseModel):
    name: str
    lat: float
    lng: float
    elevation: float = 0
    eta: str = '12:00'
    type: str = Field(..., pattern='^(supply|camp)$')
    order: int = 0
    hasWater: bool = False
    hasShelter: bool = False


class PointUpdate(BaseModel):
    name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    elevation: Optional[float] = None
    eta: Optional[str] = None
    type: Optional[str] = None
    hasWater: Optional[bool] = None
    hasShelter: Optional[bool] = None
    order: Optional[int] = None


class RouteCreate(BaseModel):
    name: str
    description: Optional[str] = None
    points: List[PointCreate] = []


class RouteUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    total_distance: Optional[float] = None
    total_duration: Optional[float] = None


class JoinRequest(BaseModel):
    routeCode: str
    memberName: str


class PositionUpdate(BaseModel):
    memberId: str
    lat: float
    lng: float
    status: str = Field(..., pattern='^(moving|resting|trouble)$')


@app.get('/api/routes')
def list_routes():
    return get_all_routes()


@app.post('/api/routes')
def create_new_route(data: RouteCreate):
    route = create_route(data.name, data.description)
    for i, point in enumerate(data.points):
        add_route_point(
            route['id'],
            point.name,
            point.lat,
            point.lng,
            point.elevation,
            point.eta,
            point.type,
            i,
            point.hasWater,
            point.hasShelter,
        )
    recalc_route_stats(route['id'])
    return get_route(route['id'])


@app.get('/api/routes/{route_id}')
def get_single_route(route_id: str):
    route = get_route(route_id)
    if not route:
        raise HTTPException(status_code=404, detail='Route not found')
    return route


@app.get('/api/routes/code/{code}')
def get_route_code(code: str):
    route = get_route_by_code(code)
    if not route:
        raise HTTPException(status_code=404, detail='Route not found')
    return route


@app.put('/api/routes/{route_id}')
def update_single_route(route_id: str, data: RouteUpdate):
    route = update_route(
        route_id,
        name=data.name,
        description=data.description,
        total_distance=data.total_distance,
        total_duration=data.total_duration,
    )
    if not route:
        raise HTTPException(status_code=404, detail='Route not found')
    return route


@app.post('/api/routes/{route_id}/points')
def create_point(route_id: str, point: PointCreate):
    route = get_route(route_id)
    if not route:
        raise HTTPException(status_code=404, detail='Route not found')
    new_point = add_route_point(
        route_id,
        point.name,
        point.lat,
        point.lng,
        point.elevation,
        point.eta,
        point.type,
        point.order,
        point.hasWater,
        point.hasShelter,
    )
    recalc_route_stats(route_id)
    return new_point


@app.put('/api/routes/{route_id}/points/{point_id}')
def update_point(route_id: str, point_id: str, data: PointUpdate):
    point = update_route_point(
        point_id,
        name=data.name,
        lat=data.lat,
        lng=data.lng,
        elevation=data.elevation,
        eta=data.eta,
        type=data.type,
        hasWater=data.hasWater,
        hasShelter=data.hasShelter,
        order=data.order,
    )
    if not point:
        raise HTTPException(status_code=404, detail='Point not found')
    recalc_route_stats(route_id)
    return point


@app.delete('/api/routes/{route_id}/points/{point_id}')
def delete_point(route_id: str, point_id: str):
    success = delete_route_point(point_id)
    if not success:
        raise HTTPException(status_code=404, detail='Point not found')
    points = get_route_points(route_id)
    for i, p in enumerate(points):
        update_route_point(p['id'], order=i)
    recalc_route_stats(route_id)
    return {'success': True}


@app.get('/api/team/{route_id}')
def get_team(route_id: str):
    route = get_route(route_id)
    if not route:
        raise HTTPException(status_code=404, detail='Route not found')

    members = get_team_members(route_id)
    points = route.get('points', [])

    total = len(members)
    arrived = sum(1 for m in members if m.get('nearest_point_id'))
    avg_progress = (
        round(sum(m.get('progress', 0) for m in members) / total, 1)
        if total > 0
        else 0
    )

    heatmap = []
    for m in members:
        if m.get('lat') and m.get('lng'):
            intensity = 0.5
            if m['status'] == 'trouble':
                intensity = 1.0
            elif m['status'] == 'resting':
                intensity = 0.7
            heatmap.append([float(m['lat']), float(m['lng']), intensity])

    return {
        'members': members,
        'totalMembers': total,
        'arrivedMembers': arrived,
        'averageProgress': avg_progress,
        'heatmapData': heatmap,
    }


@app.post('/api/team/join')
def join_team(data: JoinRequest):
    route = get_route_by_code(data.routeCode)
    if not route:
        raise HTTPException(status_code=404, detail='Route not found')
    member = add_team_member(route['id'], data.memberName)
    return member


@app.post('/api/team/position')
def update_position(data: PositionUpdate):
    member = database.get_team_member(data.memberId)
    if not member:
        raise HTTPException(status_code=404, detail='Member not found')

    points = get_route_points(member['route_id'])
    nearest = find_nearest_point(data.lat, data.lng, points)
    progress = calculate_member_progress(data.lat, data.lng, points)

    updated = update_member_position(
        data.memberId,
        data.lat,
        data.lng,
        data.status,
        nearest_point_id=nearest['id'] if nearest else None,
        progress=progress,
    )
    return updated
