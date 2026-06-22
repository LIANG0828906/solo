from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from datetime import timedelta
from models import TrainingRecord, Achievement, UserAchievement
from datetime import datetime


def check_achievements(db: Session):
    achievements = db.query(Achievement).all()
    unlocked_achievements = []

    for achievement in achievements:
        user_achievement = db.query(UserAchievement).filter(
            UserAchievement.achievement_id == achievement.id
        ).first()

        if user_achievement and user_achievement.unlocked:
            continue

        is_unlocked = False

        if achievement.condition_type == "consecutive_days":
            is_unlocked = check_consecutive_days(db, achievement.condition_value)
        elif achievement.condition_type == "unique_types":
            is_unlocked = check_unique_types(db, achievement.condition_value)
        elif achievement.condition_type == "total_minutes":
            is_unlocked = check_total_minutes(db, achievement.condition_value)
        elif achievement.condition_type == "total_records":
            is_unlocked = check_total_records(db, achievement.condition_value)
        elif achievement.condition_type.startswith("type_minutes_"):
            workout_type = achievement.condition_type.replace("type_minutes_", "")
            is_unlocked = check_type_minutes(db, workout_type, achievement.condition_value)

        if is_unlocked:
            if not user_achievement:
                user_achievement = UserAchievement(
                    achievement_id=achievement.id,
                    unlocked=True,
                    unlocked_at=datetime.utcnow()
                )
                db.add(user_achievement)
            else:
                user_achievement.unlocked = True
                user_achievement.unlocked_at = datetime.utcnow()
            unlocked_achievements.append(achievement)

    db.commit()
    return unlocked_achievements


def check_consecutive_days(db: Session, days: int) -> bool:
    records = db.query(TrainingRecord).order_by(TrainingRecord.date.desc()).all()
    if not records:
        return False

    unique_dates = sorted(set(record.date for record in records), reverse=True)
    if len(unique_dates) < days:
        return False

    consecutive_count = 1
    for i in range(1, len(unique_dates)):
        if unique_dates[i - 1] - unique_dates[i] == timedelta(days=1):
            consecutive_count += 1
            if consecutive_count >= days:
                return True
        else:
            consecutive_count = 1

    return consecutive_count >= days


def check_unique_types(db: Session, count: int) -> bool:
    type_count = db.query(func.count(distinct(TrainingRecord.type))).scalar()
    return type_count >= count


def check_total_minutes(db: Session, minutes: int) -> bool:
    total = db.query(func.sum(TrainingRecord.duration)).scalar() or 0
    return total >= minutes


def check_total_records(db: Session, count: int) -> bool:
    total = db.query(func.count(TrainingRecord.id)).scalar()
    return total >= count


def check_type_minutes(db: Session, workout_type: str, minutes: int) -> bool:
    total = db.query(func.sum(TrainingRecord.duration)).filter(
        func.lower(TrainingRecord.type) == workout_type.lower()
    ).scalar() or 0
    return total >= minutes
