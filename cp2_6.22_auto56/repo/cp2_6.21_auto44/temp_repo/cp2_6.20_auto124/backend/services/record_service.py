from datetime import datetime
from typing import List
from database import get_db
from models import TrainingRecord, TrainingRecordCreate
from services.achievement_service import check_and_unlock_achievements


def get_all_records() -> List[TrainingRecord]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM training_records ORDER BY date DESC, id DESC")
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        result.append(
            TrainingRecord(
                id=row["id"],
                type=row["type"],
                typeName=row["type_name"],
                duration=row["duration"],
                date=row["date"],
                note=row["note"],
                createdAt=row["created_at"],
            )
        )
    return result


def add_record(record_data: TrainingRecordCreate) -> TrainingRecord:
    conn = get_db()
    cursor = conn.cursor()

    now = datetime.now().isoformat()

    cursor.execute(
        """
        INSERT INTO training_records (type, type_name, duration, date, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            record_data.type,
            record_data.typeName,
            record_data.duration,
            record_data.date,
            record_data.note or "",
            now,
        ),
    )

    record_id = cursor.lastrowid
    conn.commit()
    conn.close()

    check_and_unlock_achievements()

    return TrainingRecord(
        id=record_id,
        type=record_data.type,
        typeName=record_data.typeName,
        duration=record_data.duration,
        date=record_data.date,
        note=record_data.note or "",
        createdAt=now,
    )
