import sqlite3
import uuid
import random
import string
from datetime import datetime
from typing import List, Optional, Dict, Any

DATABASE_NAME = "expedition.db"

def get_db_connection():
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def generate_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    import math
    R = 6371
    dLat = (lat2 - lat1) * math.pi / 180
    dLng = (lng2 - lng1) * math.pi / 180
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(lat1 * math.pi / 180) * math.cos(lat2 * math.pi / 180) * \
        math.sin(dLng/2) * math.sin(dLng/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS routes (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            total_distance REAL DEFAULT 0,
            estimated_duration INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS points (
            id TEXT PRIMARY KEY,
            route_id TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('supply', 'camp')),
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            altitude REAL NOT NULL,
            estimated_arrival TEXT NOT NULL,
            has_water INTEGER DEFAULT 0,
            has_shelter INTEGER DEFAULT 0,
            FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS team_members (
            id TEXT PRIMARY KEY,
            route_id TEXT NOT NULL,
            name TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('moving', 'resting', 'trouble')),
            last_update TEXT NOT NULL,
            nearest_point_id TEXT,
            FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    conn.close()

def create_route(name: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    route_id = str(uuid.uuid4())
    code = generate_code()
    created_at = datetime.now().isoformat()

    while True:
        cursor.execute('SELECT id FROM routes WHERE code = ?', (code,))
        if not cursor.fetchone():
            break
        code = generate_code()

    cursor.execute(
        'INSERT INTO routes (id, code, name, created_at) VALUES (?, ?, ?, ?)',
        (route_id, code, name, created_at)
    )

    conn.commit()

    cursor.execute('SELECT * FROM routes WHERE id = ?', (route_id,))
    route = dict(cursor.fetchone())

    conn.close()

    return {
        **route,
        'points': []
    }

def get_route(route_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM routes WHERE id = ?', (route_id,))
    route_row = cursor.fetchone()

    if not route_row:
        conn.close()
        return None

    route = dict(route_row)

    cursor.execute('SELECT * FROM points WHERE route_id = ? ORDER BY estimated_arrival', (route_id,))
    points = [dict(row) for row in cursor.fetchall()]

    for point in points:
        point['hasWater'] = bool(point.pop('has_water'))
        point['hasShelter'] = bool(point.pop('has_shelter'))
        point['estimatedArrival'] = point.pop('estimated_arrival')

    route['points'] = points

    conn.close()
    return route

def get_route_by_code(code: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM routes WHERE code = ?', (code.upper(),))
    route_row = cursor.fetchone()

    conn.close()

    if not route_row:
        return None

    return get_route(route_row['id'])

def get_all_routes() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM routes ORDER BY created_at DESC')
    route_ids = [row['id'] for row in cursor.fetchall()]

    conn.close()

    routes = []
    for route_id in route_ids:
        route = get_route(route_id)
        if route:
            routes.append(route)

    return routes

def update_route(route_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    updates = []
    params = []

    if 'name' in data:
        updates.append('name = ?')
        params.append(data['name'])
    if 'totalDistance' in data:
        updates.append('total_distance = ?')
        params.append(data['totalDistance'])
    if 'estimatedDuration' in data:
        updates.append('estimated_duration = ?')
        params.append(data['estimatedDuration'])

    if updates:
        params.append(route_id)
        cursor.execute(
            f'UPDATE routes SET {", ".join(updates)} WHERE id = ?',
            params
        )
        conn.commit()

    conn.close()
    return get_route(route_id)

def add_point(route_id: str, point_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    point_id = str(uuid.uuid4())

    cursor.execute(
        '''INSERT INTO points (id, route_id, name, type, lat, lng, altitude, estimated_arrival, has_water, has_shelter)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (
            point_id,
            route_id,
            point_data['name'],
            point_data['type'],
            point_data['lat'],
            point_data['lng'],
            point_data['altitude'],
            point_data['estimatedArrival'],
            1 if point_data.get('hasWater') else 0,
            1 if point_data.get('hasShelter') else 0
        )
    )

    conn.commit()

    cursor.execute('SELECT * FROM points WHERE id = ?', (point_id,))
    point = dict(cursor.fetchone())

    point['hasWater'] = bool(point.pop('has_water'))
    point['hasShelter'] = bool(point.pop('has_shelter'))
    point['estimatedArrival'] = point.pop('estimated_arrival')

    update_route_stats(route_id)

    conn.close()
    return point

def update_point(route_id: str, point_id: str, point_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    updates = []
    params = []

    field_mapping = {
        'name': 'name',
        'type': 'type',
        'lat': 'lat',
        'lng': 'lng',
        'altitude': 'altitude',
        'estimatedArrival': 'estimated_arrival',
        'hasWater': 'has_water',
        'hasShelter': 'has_shelter'
    }

    for key, db_field in field_mapping.items():
        if key in point_data:
            updates.append(f'{db_field} = ?')
            if key in ('hasWater', 'hasShelter'):
                params.append(1 if point_data[key] else 0)
            else:
                params.append(point_data[key])

    if updates:
        params.extend([point_id, route_id])
        cursor.execute(
            f'UPDATE points SET {", ".join(updates)} WHERE id = ? AND route_id = ?',
            params
        )
        conn.commit()

    cursor.execute('SELECT * FROM points WHERE id = ?', (point_id,))
    point_row = cursor.fetchone()

    if not point_row:
        conn.close()
        return None

    point = dict(point_row)
    point['hasWater'] = bool(point.pop('has_water'))
    point['hasShelter'] = bool(point.pop('has_shelter'))
    point['estimatedArrival'] = point.pop('estimated_arrival')

    update_route_stats(route_id)

    conn.close()
    return point

def delete_point(route_id: str, point_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('DELETE FROM points WHERE id = ? AND route_id = ?', (point_id, route_id))
    deleted = cursor.rowcount > 0

    conn.commit()

    if deleted:
        update_route_stats(route_id)

    conn.close()
    return deleted

def update_route_stats(route_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM points WHERE route_id = ? ORDER BY estimated_arrival', (route_id,))
    points = [dict(row) for row in cursor.fetchall()]

    if len(points) >= 2:
        total_distance = 0
        for i in range(len(points) - 1):
            total_distance += calculate_distance(
                points[i]['lat'], points[i]['lng'],
                points[i+1]['lat'], points[i+1]['lng']
            )

        def parse_time(t):
            h, m = t.split(':')
            return int(h) * 60 + int(m)

        times = [parse_time(p['estimated_arrival']) for p in points]
        duration = max(times) - min(times) if times else 0

        cursor.execute(
            'UPDATE routes SET total_distance = ?, estimated_duration = ? WHERE id = ?',
            (round(total_distance, 2), max(0, duration), route_id)
        )
    else:
        cursor.execute(
            'UPDATE routes SET total_distance = 0, estimated_duration = 0 WHERE id = ?',
            (route_id,)
        )

    conn.commit()
    conn.close()

def join_route(route_id: str, name: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    member_id = str(uuid.uuid4())
    now = datetime.now().isoformat()

    cursor.execute('SELECT lat, lng FROM points WHERE route_id = ? ORDER BY estimated_arrival LIMIT 1', (route_id,))
    start_point = cursor.fetchone()

    if start_point:
        lat, lng = start_point['lat'], start_point['lng']
    else:
        lat, lng = 35.8617, 104.1954

    cursor.execute(
        '''INSERT INTO team_members (id, route_id, name, lat, lng, status, last_update)
           VALUES (?, ?, ?, ?, ?, 'moving', ?)''',
        (member_id, route_id, name, lat, lng, now)
    )

    conn.commit()

    cursor.execute('SELECT * FROM team_members WHERE id = ?', (member_id,))
    member = dict(cursor.fetchone())
    member['lastUpdate'] = member.pop('last_update')
    member['nearestPointId'] = member.pop('nearest_point_id')

    conn.close()
    return member

def update_position(member_id: str, route_id: str, name: str, lat: float, lng: float, status: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    now = datetime.now().isoformat()

    cursor.execute('SELECT id, lat, lng FROM points WHERE route_id = ?', (route_id,))
    points = [dict(row) for row in cursor.fetchall()]

    nearest_point_id = None
    min_distance = float('inf')

    for point in points:
        dist = calculate_distance(lat, lng, point['lat'], point['lng'])
        if dist < min_distance:
            min_distance = dist
            nearest_point_id = point['id']

    cursor.execute('SELECT id FROM team_members WHERE id = ?', (member_id,))
    exists = cursor.fetchone()

    if exists:
        cursor.execute(
            '''UPDATE team_members
               SET name = ?, lat = ?, lng = ?, status = ?, last_update = ?, nearest_point_id = ?
               WHERE id = ?''',
            (name, lat, lng, status, now, nearest_point_id, member_id)
        )
    else:
        cursor.execute(
            '''INSERT INTO team_members (id, route_id, name, lat, lng, status, last_update, nearest_point_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            (member_id, route_id, name, lat, lng, status, now, nearest_point_id)
        )

    conn.commit()

    cursor.execute('SELECT * FROM team_members WHERE id = ?', (member_id,))
    member = dict(cursor.fetchone())
    member['lastUpdate'] = member.pop('last_update')
    member['nearestPointId'] = member.pop('nearest_point_id')

    conn.close()
    return member

def get_team_members(route_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        'SELECT * FROM team_members WHERE route_id = ? ORDER BY last_update DESC',
        (route_id,)
    )
    members = [dict(row) for row in cursor.fetchall()]

    for member in members:
        member['lastUpdate'] = member.pop('last_update')
        member['nearestPointId'] = member.pop('nearest_point_id')

    conn.close()
    return members

def get_team_data(route_id: str) -> Dict[str, Any]:
    members = get_team_members(route_id)
    route = get_route(route_id)

    heatmap_data = []
    for member in members:
        intensity = 1.0 if member['status'] == 'moving' else 0.6 if member['status'] == 'resting' else 1.5
        heatmap_data.append([member['lat'], member['lng'], intensity])

    total_members = len(members)

    cursor = get_db_connection().cursor()
    cursor.execute('SELECT COUNT(DISTINCT nearest_point_id) as arrived FROM team_members WHERE route_id = ? AND nearest_point_id IS NOT NULL', (route_id,))
    arrived_count = cursor.fetchone()['arrived']

    if route and route['points']:
        total_points = len(route['points'])
        progress_sum = 0

        for member in members:
            if member['nearestPointId']:
                point_indices = {p['id']: i for i, p in enumerate(route['points'])}
                idx = point_indices.get(member['nearestPointId'], 0)
                progress_sum += (idx / (total_points - 1)) * 100 if total_points > 1 else 0

        average_progress = round(progress_sum / total_members, 1) if total_members > 0 else 0
    else:
        average_progress = 0

    return {
        'routeId': route_id,
        'members': members,
        'heatmapData': heatmap_data,
        'stats': {
            'totalMembers': total_members,
            'arrivedSupply': arrived_count,
            'averageProgress': average_progress
        }
    }

init_db()
