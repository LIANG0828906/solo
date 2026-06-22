from datetime import datetime, timedelta
import random

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

Base = declarative_base()

engine = create_engine("sqlite:///./space_gravity.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, default="member")
    created_at = Column(DateTime, default=datetime.utcnow)

    reservations = relationship("Reservation", back_populates="user")
    notifications = relationship("Notification", back_populates="user")


class Space(Base):
    __tablename__ = "spaces"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    space_type = Column(String, nullable=False)
    floor = Column(Integer, nullable=False)
    capacity = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    reservations = relationship("Reservation", back_populates="space")


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    space_id = Column(Integer, ForeignKey("spaces.id"), nullable=False)
    date = Column(String, nullable=False)
    time_slot = Column(String, nullable=False)
    num_people = Column(Integer, nullable=False)
    status = Column(String, default="待确认")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reservations")
    space = relationship("Space", back_populates="reservations")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read = Column(Boolean, default=False)

    user = relationship("User", back_populates="notifications")


def seed_data():
    db = SessionLocal()
    try:
        if db.query(User).first():
            return

        users = [
            User(name="张伟", email="zhangwei@example.com", role="admin"),
            User(name="李娜", email="lina@example.com", role="member"),
            User(name="王强", email="wangqiang@example.com", role="member"),
            User(name="赵敏", email="zhaomin@example.com", role="member"),
            User(name="陈思", email="chensi@example.com", role="member"),
        ]
        db.add_all(users)
        db.flush()

        spaces = []
        room_names = ["星辰厅", "月光厅", "晨曦厅", "暮光厅"]
        for floor in range(1, 4):
            for i, room_name in enumerate(room_names, start=1):
                cap = random.choice([6, 8, 10, 12, 16])
                spaces.append(Space(
                    name=f"{floor}F-{room_name}",
                    space_type="会议室",
                    floor=floor,
                    capacity=cap,
                    available_seats=cap,
                ))
            for i in range(1, 9):
                cap = random.choice([1, 1, 2, 2, 4])
                spaces.append(Space(
                    name=f"{floor}F-工位{i:02d}",
                    space_type="工位",
                    floor=floor,
                    capacity=cap,
                    available_seats=cap,
                ))
        db.add_all(spaces)
        db.flush()

        time_slots = ["9:00-12:00", "13:00-18:00"]
        statuses = ["待确认", "已确认", "已取消"]

        today = datetime.utcnow().date()
        for day_offset in range(7):
            date_str = (today - timedelta(days=6 - day_offset)).strftime("%Y-%m-%d")
            num_reservations = random.randint(2, 4)
            for _ in range(num_reservations):
                space = random.choice(spaces)
                user = random.choice(users)
                time_slot = random.choice(time_slots)
                num_people = random.randint(1, min(space.capacity, 4))
                if space.space_type == "工位":
                    num_people = 1
                status = random.choice(statuses)
                if day_offset >= 5:
                    status = random.choice(["已确认", "已取消"])
                db.add(Reservation(
                    user_id=user.id,
                    space_id=space.id,
                    date=date_str,
                    time_slot=time_slot,
                    num_people=num_people,
                    status=status,
                ))

        db.flush()

        sample_notifications = [
            Notification(user_id=2, message="您的预约已确认", type="confirm", read=False),
            Notification(user_id=3, message="您的预约已取消", type="cancel", read=False),
            Notification(user_id=4, message="您的预约已确认", type="confirm", read=True),
            Notification(user_id=5, message="您的预约已取消", type="cancel", read=False),
            Notification(user_id=1, message="新预约待审批", type="confirm", read=False),
        ]
        db.add_all(sample_notifications)

        db.commit()
    finally:
        db.close()
