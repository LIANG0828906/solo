from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    email = Column(String, unique=True, index=True)

    goal = relationship("Goal", back_populates="user", uselist=False)
    records = relationship("HealthRecord", back_populates="user")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    target_weight = Column(Float, default=65.0)
    target_steps = Column(Integer, default=8000)
    target_sleep = Column(Float, default=8.0)
    target_water = Column(Integer, default=8)

    user = relationship("User", back_populates="goal")


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date, index=True)
    weight = Column(Float, default=0.0)
    steps = Column(Integer, default=0)
    sleep_hours = Column(Float, default=0.0)
    water_cups = Column(Integer, default=0)

    user = relationship("User", back_populates="records")
