from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "events.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Event(Base):
    __tablename__ = "events"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(256), nullable=False, index=True)
    date = Column(String(64), nullable=False)
    location = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    checkins = relationship("Checkin", back_populates="event", cascade="all, delete-orphan")


class Checkin(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    event_id = Column(String(64), ForeignKey("events.id"), nullable=False, index=True)
    participant_name = Column(String(128), nullable=False)
    device_id = Column(String(128), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    x = Column(Float, default=50.0)
    y = Column(Float, default=50.0)
    checkin_number = Column(Integer, nullable=False)

    event = relationship("Event", back_populates="checkins")

    __table_args__ = (
        Index("ix_checkin_event_device", "event_id", "device_id", "timestamp"),
    )


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
