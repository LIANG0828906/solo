import sqlite3
import os
import math
from typing import Optional, List

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "emotion.db")


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            category TEXT NOT NULL,
            intensity INTEGER NOT NULL,
            energy INTEGER NOT NULL,
            note TEXT DEFAULT '',
            tags TEXT DEFAULT ''
        )
    """)
    conn.commit()
    conn.close()


def create_record(timestamp: str, category: str, intensity: int, energy: int,
                  note: str, tags: str) -> int:
    conn = get_conn()
    cursor = conn.execute(
        "INSERT INTO records (timestamp, category, intensity, energy, note, tags) VALUES (?, ?, ?, ?, ?, ?)",
        (timestamp, category, intensity, energy, note, tags)
    )
    record_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return record_id


def get_records_by_date(date: str) -> List[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM records WHERE timestamp LIKE ? ORDER BY timestamp ASC",
        (f"{date}%",)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_records_range(start_date: str, end_date: str) -> List[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM records WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC",
        (f"{start_date}T00:00:00", f"{end_date}T23:59:59")
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_calendar_data(month: str) -> List[dict]:
    conn = get_conn()
    rows = conn.execute("""
        SELECT 
            DATE(timestamp) as date,
            ROUND(AVG(intensity), 2) as avg_intensity,
            ROUND(AVG(energy), 2) as avg_energy,
            COUNT(*) as count
        FROM records 
        WHERE timestamp LIKE ?
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
    """, (f"{month}%",)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_trends(days: int) -> List[dict]:
    conn = get_conn()
    rows = conn.execute("""
        SELECT 
            DATE(timestamp) as date,
            ROUND(AVG(intensity), 2) as avg_intensity,
            ROUND(AVG(energy), 2) as avg_energy
        FROM records 
        WHERE timestamp >= DATE('now', '-' || ? || ' days')
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
    """, (days,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_analysis() -> dict:
    conn = get_conn()

    rows = conn.execute("SELECT intensity, energy, tags FROM records").fetchall()
    conn.close()

    if not rows:
        return {
            "avg_intensity": 0,
            "std_intensity": 0,
            "max_day": None,
            "min_day": None,
            "correlation": None,
            "tag_stats": []
        }

    intensities = [r["intensity"] for r in rows]
    energies = [r["energy"] for r in rows]
    n = len(intensities)

    avg_intensity = round(sum(intensities) / n, 2)
    variance = sum((x - avg_intensity) ** 2 for x in intensities) / n
    std_intensity = round(math.sqrt(variance), 2)

    conn = get_conn()
    max_day_row = conn.execute("""
        SELECT DATE(timestamp) as date, ROUND(AVG(intensity), 2) as avg_i
        FROM records GROUP BY DATE(timestamp) ORDER BY avg_i DESC LIMIT 1
    """).fetchone()

    min_day_row = conn.execute("""
        SELECT DATE(timestamp) as date, ROUND(AVG(intensity), 2) as avg_i
        FROM records GROUP BY DATE(timestamp) ORDER BY avg_i ASC LIMIT 1
    """).fetchone()
    conn.close()

    correlation = None
    if n > 1:
        sum_i = sum(intensities)
        sum_e = sum(energies)
        sum_ii = sum(x * x for x in intensities)
        sum_ee = sum(x * x for x in energies)
        sum_ie = sum(a * b for a, b in zip(intensities, energies))
        denom = ((n * sum_ii - sum_i ** 2) * (n * sum_ee - sum_e ** 2)) ** 0.5
        if denom > 0:
            correlation = round((n * sum_ie - sum_i * sum_e) / denom, 2)

    tag_map: dict = {}
    for r in rows:
        if not r["tags"] or not r["tags"].strip():
            continue
        for tag in r["tags"].split(","):
            tag = tag.strip()
            if not tag:
                continue
            if tag not in tag_map:
                tag_map[tag] = {"sum": 0, "count": 0}
            tag_map[tag]["sum"] += r["intensity"]
            tag_map[tag]["count"] += 1

    tag_stats = [
        {
            "tag": tag,
            "avg_intensity": round(data["sum"] / data["count"], 2),
            "count": data["count"]
        }
        for tag, data in sorted(tag_map.items(), key=lambda x: x[1]["sum"] / x[1]["count"], reverse=True)
    ]

    return {
        "avg_intensity": avg_intensity,
        "std_intensity": std_intensity,
        "max_day": max_day_row["date"] if max_day_row else None,
        "min_day": min_day_row["date"] if min_day_row else None,
        "correlation": correlation,
        "tag_stats": tag_stats
    }
