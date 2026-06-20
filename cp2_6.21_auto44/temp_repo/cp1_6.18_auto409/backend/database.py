from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
import random

from .models import Base, Member, DailyRecord

DATABASE_URL = "sqlite:///./fitness.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Member).count() > 0:
        db.close()
        return

    nicknames = [
        "闪电跑者", "晨曦行者", "疾风健身", "星夜漫步", "阳光骑士",
        "月影奔者", "追风中人", "烈火战士", "云端行者", "雷霆动力"
    ]

    members = []
    for i, nickname in enumerate(nicknames):
        avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={i + 1}"
        member = Member(nickname=nickname, avatar_url=avatar_url)
        db.add(member)
        members.append(member)

    db.flush()

    today = datetime.date.today()
    for member in members:
        for day_offset in range(29, -1, -1):
            record_date = today - datetime.timedelta(days=day_offset)
            steps = random.randint(3000, 18000)
            duration = random.randint(20, 120)
            calories = int(steps * 0.04 + random.randint(50, 200))
            record = DailyRecord(
                member_id=member.id,
                date=record_date,
                steps=steps,
                duration=duration,
                calories=calories
            )
            db.add(record)

    db.commit()
    db.close()
