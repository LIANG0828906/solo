import sqlite3
import os
import json
from contextlib import contextmanager
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "auto77.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS semantic_groups (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            keyword TEXT NOT NULL,
            x REAL NOT NULL DEFAULT 0,
            y REAL NOT NULL DEFAULT 0,
            width REAL NOT NULL DEFAULT 400,
            height REAL NOT NULL DEFAULT 300,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES rooms(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS nodes (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            title TEXT NOT NULL,
            note TEXT DEFAULT '',
            tags TEXT DEFAULT '[]',
            x REAL NOT NULL DEFAULT 0,
            y REAL NOT NULL DEFAULT 0,
            width REAL NOT NULL DEFAULT 200,
            height REAL NOT NULL DEFAULT 80,
            group_id TEXT DEFAULT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES rooms(id),
            FOREIGN KEY (group_id) REFERENCES semantic_groups(id)
        )
    ''')

    try:
        cursor.execute("SELECT group_id FROM nodes LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE nodes ADD COLUMN group_id TEXT DEFAULT NULL")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_nodes_group_id ON nodes(group_id)")

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS connections (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            from_node_id TEXT NOT NULL,
            to_node_id TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES rooms(id),
            FOREIGN KEY (from_node_id) REFERENCES nodes(id),
            FOREIGN KEY (to_node_id) REFERENCES nodes(id)
        )
    ''')

    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_nodes_room_id ON nodes(room_id)
    ''')
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_nodes_group_id ON nodes(group_id)
    ''')
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_connections_room_id ON connections(room_id)
    ''')
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_groups_room_id ON semantic_groups(room_id)
    ''')

    conn.commit()
    conn.close()


def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    d = dict(row)
    if 'tags' in d and d['tags']:
        try:
            d['tags'] = json.loads(d['tags'])
        except (json.JSONDecodeError, TypeError):
            d['tags'] = []
    return d


def create_room(conn: sqlite3.Connection, room_id: str, name: str) -> bool:
    try:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO rooms (id, name) VALUES (?, ?)',
            (room_id, name)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False


def get_room(conn: sqlite3.Connection, room_id: str) -> Optional[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM rooms WHERE id = ?', (room_id,))
    row = cursor.fetchone()
    return _row_to_dict(row) if row else None


def create_node(
    conn: sqlite3.Connection,
    node_id: str,
    room_id: str,
    title: str,
    note: str = '',
    tags: List[str] = None,
    x: float = 0,
    y: float = 0,
    width: float = 200,
    height: float = 80,
    group_id: Optional[str] = None,
) -> Dict[str, Any]:
    tags_json = json.dumps(tags or [])
    cursor = conn.cursor()
    cursor.execute(
        '''INSERT INTO nodes
           (id, room_id, title, note, tags, x, y, width, height, group_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (node_id, room_id, title, note, tags_json, x, y, width, height, group_id)
    )
    conn.commit()
    return get_node(conn, node_id)


def get_node(conn: sqlite3.Connection, node_id: str) -> Optional[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM nodes WHERE id = ?', (node_id,))
    row = cursor.fetchone()
    return _row_to_dict(row) if row else None


def get_nodes_by_room(conn: sqlite3.Connection, room_id: str) -> List[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM nodes WHERE room_id = ? ORDER BY created_at', (room_id,))
    return [_row_to_dict(r) for r in cursor.fetchall()]


def update_node(
    conn: sqlite3.Connection,
    node_id: str,
    **fields
) -> Optional[Dict[str, Any]]:
    if not fields:
        return get_node(conn, node_id)

    allowed_fields = {'title', 'note', 'tags', 'x', 'y', 'width', 'height', 'group_id'}
    update_fields = {k: v for k, v in fields.items() if k in allowed_fields}

    if not update_fields:
        return get_node(conn, node_id)

    if 'tags' in update_fields:
        update_fields['tags'] = json.dumps(update_fields['tags'])

    set_clause = ', '.join(f'{k} = ?' for k in update_fields.keys())
    values = list(update_fields.values()) + [node_id]

    cursor = conn.cursor()
    cursor.execute(f'UPDATE nodes SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?', values)
    conn.commit()
    return get_node(conn, node_id)


def delete_node(conn: sqlite3.Connection, node_id: str) -> bool:
    cursor = conn.cursor()
    cursor.execute('DELETE FROM connections WHERE from_node_id = ? OR to_node_id = ?', (node_id, node_id))
    cursor.execute('DELETE FROM nodes WHERE id = ?', (node_id,))
    conn.commit()
    return cursor.rowcount > 0


def create_connection(
    conn: sqlite3.Connection,
    conn_id: str,
    room_id: str,
    from_node_id: str,
    to_node_id: str,
) -> Optional[Dict[str, Any]]:
    cursor = conn.cursor()
    try:
        cursor.execute(
            '''INSERT INTO connections (id, room_id, from_node_id, to_node_id)
               VALUES (?, ?, ?, ?)''',
            (conn_id, room_id, from_node_id, to_node_id)
        )
        conn.commit()
        return get_connection(conn, conn_id)
    except sqlite3.IntegrityError:
        return None


def get_connection(conn: sqlite3.Connection, conn_id: str) -> Optional[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM connections WHERE id = ?', (conn_id,))
    row = cursor.fetchone()
    return _row_to_dict(row) if row else None


def get_connections_by_room(conn: sqlite3.Connection, room_id: str) -> List[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM connections WHERE room_id = ? ORDER BY created_at', (room_id,))
    return [_row_to_dict(r) for r in cursor.fetchall()]


def delete_connection(conn: sqlite3.Connection, conn_id: str) -> bool:
    cursor = conn.cursor()
    cursor.execute('DELETE FROM connections WHERE id = ?', (conn_id,))
    conn.commit()
    return cursor.rowcount > 0


def create_group(
    conn: sqlite3.Connection,
    group_id: str,
    room_id: str,
    keyword: str,
    x: float = 0,
    y: float = 0,
    width: float = 400,
    height: float = 300,
) -> Dict[str, Any]:
    cursor = conn.cursor()
    cursor.execute(
        '''INSERT INTO semantic_groups (id, room_id, keyword, x, y, width, height)
           VALUES (?, ?, ?, ?, ?, ?, ?)''',
        (group_id, room_id, keyword, x, y, width, height)
    )
    conn.commit()
    return get_group(conn, group_id)


def get_group(conn: sqlite3.Connection, group_id: str) -> Optional[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM semantic_groups WHERE id = ?', (group_id,))
    row = cursor.fetchone()
    return _row_to_dict(row) if row else None


def get_groups_by_room(conn: sqlite3.Connection, room_id: str) -> List[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM semantic_groups WHERE room_id = ? ORDER BY created_at', (room_id,))
    return [_row_to_dict(r) for r in cursor.fetchall()]


def update_group(conn: sqlite3.Connection, group_id: str, **fields) -> Optional[Dict[str, Any]]:
    if not fields:
        return get_group(conn, group_id)

    allowed_fields = {'keyword', 'x', 'y', 'width', 'height'}
    update_fields = {k: v for k, v in fields.items() if k in allowed_fields}

    if not update_fields:
        return get_group(conn, group_id)

    set_clause = ', '.join(f'{k} = ?' for k in update_fields.keys())
    values = list(update_fields.values()) + [group_id]

    cursor = conn.cursor()
    cursor.execute(
        f'UPDATE semantic_groups SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        values
    )
    conn.commit()
    return get_group(conn, group_id)


def delete_group(conn: sqlite3.Connection, group_id: str) -> bool:
    cursor = conn.cursor()
    cursor.execute("UPDATE nodes SET group_id = NULL WHERE group_id = ?", (group_id,))
    cursor.execute('DELETE FROM semantic_groups WHERE id = ?', (group_id,))
    conn.commit()
    return cursor.rowcount > 0


def clear_room(conn: sqlite3.Connection, room_id: str) -> bool:
    cursor = conn.cursor()
    cursor.execute('DELETE FROM connections WHERE room_id = ?', (room_id,))
    cursor.execute('DELETE FROM nodes WHERE room_id = ?', (room_id,))
    cursor.execute('DELETE FROM semantic_groups WHERE room_id = ?', (room_id,))
    conn.commit()
    return True
