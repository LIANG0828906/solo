import sqlite3
import os
from contextlib import contextmanager
from typing import List, Optional, Dict, Any
import json
import random
import string

DB_PATH = os.path.join(os.path.dirname(__file__), 'expedition.db')


def generate_route_code() -> str:
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(6))


def generate_id() -> str:
    return f"{int(__import__('time').time() * 1000)}-{random.randint(100000, 999999)}"


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS routes (
                id TEXT PRIMARY KEY,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                total_distance REAL DEFAULT 0,
                total_duration REAL DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS route_points (
                id TEXT PRIMARY KEY,
                route_id TEXT NOT NULL,
                name TEXT NOT NULL,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                elevation REAL DEFAULT 0,
                eta TEXT DEFAULT '12:00',
                type TEXT NOT NULL CHECK(type IN ('supply', 'camp')),
                has_water INTEGER DEFAULT 0,
                has_shelter INTEGER DEFAULT 0,
                point_order INTEGER NOT NULL,
                FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS team_members (
                id TEXT PRIMARY KEY,
                route_id TEXT NOT NULL,
                name TEXT NOT NULL,
                lat REAL DEFAULT 0,
                lng REAL DEFAULT 0,
                status TEXT DEFAULT 'moving' CHECK(status IN ('moving', 'resting', 'trouble')),
                last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
                nearest_point_id TEXT,
                progress REAL DEFAULT 0,
                FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
                FOREIGN KEY (nearest_point_id) REFERENCES route_points(id) ON DELETE SET NULL
            )
        """)
        conn.commit()


def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return {key: row[key] for key in row.keys()}


def create_route(name: str, description: Optional[str] = None) -> Dict[str, Any]:
    route_id = generate_id()
    code = generate_route_code()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO routes (id, code, name, description) VALUES (?, ?, ?, ?)",
            (route_id, code, name, description)
        )
    return get_route(route_id)


def get_route(route_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM routes WHERE id = ?", (route_id,))
        row = cursor.fetchone()
        if not row:
            return None
        d = row_to_dict(row)
        route = {
            'id': d['id'],
            'code': d['code'],
            'name': d['name'],
            'description': d['description'],
            'totalDistance': d['total_distance'],
            'totalDuration': d['total_duration'],
            'createdAt': d['created_at'],
            'points': get_route_points(route_id),
        }
        return route


def get_route_by_code(code: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM routes WHERE code = ?", (code.upper(),))
        row = cursor.fetchone()
        if not row:
            return None
        d = row_to_dict(row)
        route = {
            'id': d['id'],
            'code': d['code'],
            'name': d['name'],
            'description': d['description'],
            'totalDistance': d['total_distance'],
            'totalDuration': d['total_duration'],
            'createdAt': d['created_at'],
            'points': get_route_points(d['id']),
        }
        return route


def get_all_routes() -> List[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM routes ORDER BY created_at DESC")
        routes = []
        for row in cursor.fetchall():
            d = row_to_dict(row)
            routes.append({
                'id': d['id'],
                'code': d['code'],
                'name': d['name'],
                'description': d['description'],
                'totalDistance': d['total_distance'],
                'totalDuration': d['total_duration'],
                'createdAt': d['created_at'],
                'points': get_route_points(d['id']),
            })
        return routes


def update_route(route_id: str, **kwargs) -> Optional[Dict[str, Any]]:
    fields = []
    values = []
    for key, value in kwargs.items():
        if key in ('name', 'description', 'total_distance', 'total_duration'):
            fields.append(f"{key} = ?")
            values.append(value)
    if not fields:
        return get_route(route_id)
    values.append(route_id)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE routes SET {', '.join(fields)} WHERE id = ?",
            tuple(values)
        )
    return get_route(route_id)


def get_route_points(route_id: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM route_points WHERE route_id = ? ORDER BY point_order",
            (route_id,)
        )
        points = []
        for row in cursor.fetchall():
            d = row_to_dict(row)
            d['hasWater'] = bool(d.pop('has_water', 0))
            d['hasShelter'] = bool(d.pop('has_shelter', 0))
            d['order'] = d.pop('point_order')
            points.append(d)
        return points


def add_route_point(
    route_id: str,
    name: str,
    lat: float,
    lng: float,
    elevation: float,
    eta: str,
    point_type: str,
    order: int,
    has_water: bool = False,
    has_shelter: bool = False,
) -> Dict[str, Any]:
    point_id = generate_id()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO route_points
            (id, route_id, name, lat, lng, elevation, eta, type, has_water, has_shelter, point_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            point_id, route_id, name, lat, lng, elevation, eta, point_type,
            int(has_water), int(has_shelter), order
        ))
    return get_point(point_id)


def get_point(point_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM route_points WHERE id = ?", (point_id,))
        row = cursor.fetchone()
        if not row:
            return None
        d = row_to_dict(row)
        d['hasWater'] = bool(d.pop('has_water', 0))
        d['hasShelter'] = bool(d.pop('has_shelter', 0))
        d['order'] = d.pop('point_order')
        return d


def update_route_point(point_id: str, **kwargs) -> Optional[Dict[str, Any]]:
    field_map = {
        'name': 'name',
        'lat': 'lat',
        'lng': 'lng',
        'elevation': 'elevation',
        'eta': 'eta',
        'type': 'type',
        'hasWater': 'has_water',
        'hasShelter': 'has_shelter',
        'order': 'point_order',
    }
    fields = []
    values = []
    for key, value in kwargs.items():
        if key in field_map:
            db_field = field_map[key]
            if db_field in ('has_water', 'has_shelter'):
                value = int(bool(value))
            fields.append(f"{db_field} = ?")
            values.append(value)
    if not fields:
        return get_point(point_id)
    values.append(point_id)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE route_points SET {', '.join(fields)} WHERE id = ?",
            tuple(values)
        )
    return get_point(point_id)


def delete_route_point(point_id: str) -> bool:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM route_points WHERE id = ?", (point_id,))
        return cursor.rowcount > 0


def add_team_member(route_id: str, name: str) -> Dict[str, Any]:
    member_id = generate_id()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO team_members (id, route_id, name) VALUES (?, ?, ?)
        """, (member_id, route_id, name))
    return get_team_member(member_id)


def get_team_member(member_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM team_members WHERE id = ?", (member_id,))
        row = cursor.fetchone()
        if not row:
            return None
        d = row_to_dict(row)
        return {
            'id': d['id'],
            'routeId': d['route_id'],
            'name': d['name'],
            'lat': d['lat'],
            'lng': d['lng'],
            'status': d['status'],
            'lastUpdated': d['last_updated'],
            'nearestPointId': d['nearest_point_id'],
            'progress': d['progress'],
        }


def get_team_members(route_id: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM team_members WHERE route_id = ? ORDER BY last_updated DESC",
            (route_id,)
        )
        members = []
        for row in cursor.fetchall():
            d = row_to_dict(row)
            members.append({
                'id': d['id'],
                'routeId': d['route_id'],
                'name': d['name'],
                'lat': d['lat'],
                'lng': d['lng'],
                'status': d['status'],
                'lastUpdated': d['last_updated'],
                'nearestPointId': d['nearest_point_id'],
                'progress': d['progress'],
            })
        return members


def update_member_position(
    member_id: str,
    lat: float,
    lng: float,
    status: str,
    nearest_point_id: Optional[str] = None,
    progress: Optional[float] = None,
) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        updates = ["lat = ?", "lng = ?", "status = ?", "last_updated = CURRENT_TIMESTAMP"]
        values = [lat, lng, status]
        if nearest_point_id is not None:
            updates.append("nearest_point_id = ?")
            values.append(nearest_point_id)
        if progress is not None:
            updates.append("progress = ?")
            values.append(progress)
        values.append(member_id)
        cursor.execute(
            f"UPDATE team_members SET {', '.join(updates)} WHERE id = ?",
            tuple(values)
        )
    return get_team_member(member_id)


def recalc_route_stats(route_id: str):
    import math
    points = get_route_points(route_id)
    if len(points) < 2:
        update_route(route_id, total_distance=0, total_duration=0)
        return

    def haversine(lat1, lng1, lat2, lng2):
        R = 6371
        d_lat = math.radians(lat2 - lat1)
        d_lng = math.radians(lng2 - lng1)
        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(d_lng / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    total = 0.0
    for i in range(1, len(points)):
        total += haversine(
            points[i - 1]['lat'], points[i - 1]['lng'],
            points[i]['lat'], points[i]['lng']
        )
    update_route(
        route_id,
        total_distance=round(total, 2),
        total_duration=round(total * 30, 1),
    )


def find_nearest_point(lat: float, lng: float, points: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    import math
    if not points:
        return None

    def haversine(lat1, lng1, lat2, lng2):
        R = 6371
        d_lat = math.radians(lat2 - lat1)
        d_lng = math.radians(lng2 - lng1)
        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(d_lng / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    nearest = None
    min_dist = float('inf')
    for p in points:
        d = haversine(lat, lng, p['lat'], p['lng'])
        if d < min_dist:
            min_dist = d
            nearest = p
    return nearest


def calculate_member_progress(lat: float, lng: float, points: List[Dict[str, Any]]) -> float:
    import math
    if len(points) < 2:
        return 0

    def haversine(lat1, lng1, lat2, lng2):
        R = 6371
        d_lat = math.radians(lat2 - lat1)
        d_lng = math.radians(lng2 - lng1)
        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(d_lng / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    total_dist = 0
    segments = []
    for i in range(1, len(points)):
        seg = haversine(
            points[i - 1]['lat'], points[i - 1]['lng'],
            points[i]['lat'], points[i]['lng']
        )
        segments.append(seg)
        total_dist += seg

    if total_dist == 0:
        return 0

    nearest_idx = 0
    min_dist = float('inf')
    for i, p in enumerate(points):
        d = haversine(lat, lng, p['lat'], p['lng'])
        if d < min_dist:
            min_dist = d
            nearest_idx = i

    covered = 0
    for i in range(nearest_idx):
        covered += segments[i]

    if nearest_idx > 0 and nearest_idx < len(points):
        prev = points[nearest_idx - 1]
        curr = points[nearest_idx]
        seg_len = segments[nearest_idx - 1]
        if seg_len > 0:
            d_to_prev = haversine(lat, lng, prev['lat'], prev['lng'])
            frac = min(1.0, d_to_prev / seg_len)
            covered += frac * seg_len

    progress = (covered / total_dist) * 100
    return round(min(100.0, max(0.0, progress)), 1)
