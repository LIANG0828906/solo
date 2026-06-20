from datetime import datetime, timedelta
from typing import List, Dict
from database import get_db, TYPE_COLORS
from models import Achievement


def get_all_achievements() -> List[Achievement]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM achievements ORDER BY id")
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        result.append(
            Achievement(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                icon=row["icon"],
                unlocked=bool(row["unlocked"]),
                unlockedAt=row["unlocked_at"],
                condition=row["condition"],
            )
        )
    return result


def _get_user_stats(conn) -> Dict:
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM training_records")
    total_records = cursor.fetchone()["total"]

    cursor.execute("SELECT COALESCE(SUM(duration), 0) as total FROM training_records")
    total_duration = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(DISTINCT type) as count FROM training_records")
    unique_types = cursor.fetchone()["count"]

    cursor.execute("SELECT DISTINCT date FROM training_records ORDER BY date DESC")
    date_rows = cursor.fetchall()
    dates = [row["date"] for row in date_rows]

    streak_days = 0
    if dates:
        current_date = datetime.now().date()
        date_set = set(dates)
        check_date = current_date
        while str(check_date) in date_set:
            streak_days += 1
            check_date -= timedelta(days=1)

    return {
        "total_records": total_records,
        "total_duration": total_duration,
        "unique_types": unique_types,
        "streak_days": streak_days,
    }


def check_achievement_condition(condition: str, stats: Dict) -> bool:
    parts = condition.split()
    if len(parts) != 3:
        return False

    key, op, value = parts
    value = int(value)
    current = stats.get(key, 0)

    if op == ">=":
        return current >= value
    elif op == ">":
        return current > value
    elif op == "==":
        return current == value
    elif op == "<=":
        return current <= value
    elif op == "<":
        return current < value
    return False


def check_and_unlock_achievements() -> List[Achievement]:
    conn = get_db()
    stats = _get_user_stats(conn)
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM achievements WHERE unlocked = 0")
    locked_achievements = cursor.fetchall()

    newly_unlocked = []
    now = datetime.now().isoformat()

    for ach in locked_achievements:
        if check_achievement_condition(ach["condition"], stats):
            cursor.execute(
                "UPDATE achievements SET unlocked = 1, unlocked_at = ? WHERE id = ?",
                (now, ach["id"]),
            )
            newly_unlocked.append(
                Achievement(
                    id=ach["id"],
                    name=ach["name"],
                    description=ach["description"],
                    icon=ach["icon"],
                    unlocked=True,
                    unlockedAt=now,
                    condition=ach["condition"],
                )
            )

    conn.commit()
    conn.close()
    return newly_unlocked
