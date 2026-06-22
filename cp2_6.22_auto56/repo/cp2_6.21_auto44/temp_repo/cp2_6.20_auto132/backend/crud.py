from sqlalchemy.orm import Session
from datetime import date
from typing import List
from models import TrainingRecord, Achievement, UserAchievement
from schemas import TrainingRecordCreate, AchievementResponse
from database import Base, engine


def init_db():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    init_achievements(db)


def get_db():
    from database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


ACHIEVEMENTS_DATA = [
    {
        "name": "streak_7",
        "description": "坚持不懈，连续7天训练",
        "icon": "🔥",
        "condition_type": "consecutive_days",
        "condition_value": 7
    },
    {
        "name": "all_rounder",
        "description": "全能选手，完成5种不同类型训练",
        "icon": "🏆",
        "condition_type": "unique_types",
        "condition_value": 5
    },
    {
        "name": "total_1000",
        "description": "百炼成钢，累计训练1000分钟",
        "icon": "💪",
        "condition_type": "total_minutes",
        "condition_value": 1000
    },
    {
        "name": "first_workout",
        "description": "初出茅庐，完成第一次训练",
        "icon": "🌟",
        "condition_type": "total_records",
        "condition_value": 1
    },
    {
        "name": "ten_workouts",
        "description": "训练达人，完成10次训练",
        "icon": "🎯",
        "condition_type": "total_records",
        "condition_value": 10
    },
    {
        "name": "cardio_master",
        "description": "有氧之王，累计有氧训练500分钟",
        "icon": "🏃",
        "condition_type": "type_minutes_cardio",
        "condition_value": 500
    },
    {
        "name": "strength_master",
        "description": "力量王者，累计力量训练500分钟",
        "icon": "🏋️",
        "condition_type": "type_minutes_strength",
        "condition_value": 500
    },
    {
        "name": "yoga_lover",
        "description": "瑜伽爱好者，累计瑜伽训练200分钟",
        "icon": "🧘",
        "condition_type": "type_minutes_yoga",
        "condition_value": 200
    }
]


def init_achievements(db: Session):
    existing = db.query(Achievement).count()
    if existing == 0:
        for data in ACHIEVEMENTS_DATA:
            achievement = Achievement(**data)
            db.add(achievement)
        db.commit()


def get_records(db: Session, skip: int = 0, limit: int = 100) -> List[TrainingRecord]:
    return db.query(TrainingRecord).order_by(TrainingRecord.date.desc()).offset(skip).limit(limit).all()


def create_record(db: Session, record: TrainingRecordCreate) -> TrainingRecord:
    db_record = TrainingRecord(
        type=record.type,
        duration=record.duration,
        date=record.date,
        notes=record.notes
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


def get_achievements_with_status(db: Session) -> List[AchievementResponse]:
    achievements = db.query(Achievement).all()
    result = []
    for achievement in achievements:
        user_achievement = db.query(UserAchievement).filter(
            UserAchievement.achievement_id == achievement.id
        ).first()
        result.append(AchievementResponse(
            id=achievement.id,
            name=achievement.name,
            description=achievement.description,
            icon=achievement.icon,
            condition_type=achievement.condition_type,
            condition_value=achievement.condition_value,
            unlocked=user_achievement.unlocked if user_achievement else False,
            unlocked_at=user_achievement.unlocked_at if user_achievement else None
        ))
    return result


def get_records_by_month(db: Session, year: int, month: int) -> List[TrainingRecord]:
    return db.query(TrainingRecord).filter(
        TrainingRecord.date >= date(year, month, 1)
    ).filter(
        TrainingRecord.date < date(year, month + 1, 1) if month < 12 else date(year + 1, 1, 1)
    ).all()
