import sqlite3
import os
from datetime import datetime

DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "fitness.db")

TYPE_COLORS = {
    "strength": "#e74c3c",
    "cardio": "#3498db",
    "yoga": "#2ecc71",
    "other": "#9b59b6",
}

ACHIEVEMENTS = [
    {
        "id": "first_training",
        "name": "初出茅庐",
        "description": "完成第一次训练",
        "icon": "🌱",
        "condition": "total_records >= 1",
    },
    {
        "id": "streak_7",
        "name": "坚持一周",
        "description": "连续7天训练",
        "icon": "🔥",
        "condition": "streak_days >= 7",
    },
    {
        "id": "all_rounder",
        "name": "全能选手",
        "description": "完成4种不同类型训练",
        "icon": "💪",
        "condition": "unique_types >= 4",
    },
    {
        "id": "hundred_minutes",
        "name": "百分钟俱乐部",
        "description": "累计训练100分钟",
        "icon": "⏱️",
        "condition": "total_duration >= 100",
    },
    {
        "id": "thousand_minutes",
        "name": "百炼成钢",
        "description": "累计训练1000分钟",
        "icon": "🏆",
        "condition": "total_duration >= 1000",
    },
    {
        "id": "ten_records",
        "name": "训练达人",
        "description": "完成10次训练",
        "icon": "🎯",
        "condition": "total_records >= 10",
    },
    {
        "id": "streak_30",
        "name": "月度战士",
        "description": "连续30天训练",
        "icon": "⚡",
        "condition": "streak_days >= 30",
    },
]


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR, exist_ok=True)

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS training_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            type_name TEXT NOT NULL,
            duration INTEGER NOT NULL,
            date TEXT NOT NULL,
            note TEXT DEFAULT '',
            created_at TEXT NOT NULL
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS achievements (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            icon TEXT NOT NULL,
            unlocked INTEGER DEFAULT 0,
            unlocked_at TEXT,
            condition TEXT NOT NULL
        )
        """
    )

    cursor.execute("SELECT COUNT(*) FROM achievements")
    count = cursor.fetchone()[0]
    if count == 0:
        for ach in ACHIEVEMENTS:
            cursor.execute(
                """
                INSERT INTO achievements (id, name, description, icon, unlocked, unlocked_at, condition)
                VALUES (?, ?, ?, ?, 0, NULL, ?)
                """,
                (ach["id"], ach["name"], ach["description"], ach["icon"], ach["condition"]),
            )

    conn.commit()
    conn.close()
