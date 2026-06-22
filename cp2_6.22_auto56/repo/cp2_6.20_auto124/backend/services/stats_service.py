from datetime import datetime, timedelta
from typing import List, Dict
from database import get_db, TYPE_COLORS
from models import MonthStats, DailyStat, TypeStat


def get_month_stats(month: str) -> MonthStats:
    conn = get_db()
    cursor = conn.cursor()

    year, month_num = map(int, month.split("-"))
    first_day = datetime(year, month_num, 1)
    if month_num == 12:
        last_day = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = datetime(year, month_num + 1, 1) - timedelta(days=1)

    start_date = first_day.strftime("%Y-%m-%d")
    end_date = last_day.strftime("%Y-%m-%d")

    cursor.execute(
        """
        SELECT date, SUM(duration) as duration, COUNT(*) as count
        FROM training_records
        WHERE date >= ? AND date <= ?
        GROUP BY date
        ORDER BY date
        """,
        (start_date, end_date),
    )
    daily_rows = cursor.fetchall()

    daily_map = {row["date"]: row["duration"] for row in daily_rows}

    daily_stats = []
    current = first_day
    while current <= last_day:
        date_str = current.strftime("%Y-%m-%d")
        daily_stats.append(
            DailyStat(date=date_str, duration=daily_map.get(date_str, 0))
        )
        current += timedelta(days=1)

    cursor.execute(
        """
        SELECT type, type_name, SUM(duration) as duration, COUNT(*) as count
        FROM training_records
        WHERE date >= ? AND date <= ?
        GROUP BY type
        ORDER BY duration DESC
        """,
        (start_date, end_date),
    )
    type_rows = cursor.fetchall()

    type_stats = []
    for row in type_rows:
        type_stats.append(
            TypeStat(
                type=row["type"],
                typeName=row["type_name"],
                duration=row["duration"],
                color=TYPE_COLORS.get(row["type"], "#95a5a6"),
            )
        )

    cursor.execute(
        """
        SELECT COALESCE(SUM(duration), 0) as total_duration, COUNT(*) as total_records
        FROM training_records
        WHERE date >= ? AND date <= ?
        """,
        (start_date, end_date),
    )
    totals = cursor.fetchone()

    conn.close()

    return MonthStats(
        month=month,
        dailyStats=daily_stats,
        typeStats=type_stats,
        totalDuration=totals["total_duration"] or 0,
        totalRecords=totals["total_records"] or 0,
    )
