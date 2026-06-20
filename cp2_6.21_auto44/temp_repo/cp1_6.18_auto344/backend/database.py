import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import enum

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'campus_echo.db')}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class RecallType(str, enum.Enum):
    TEXT = "text"
    AUDIO = "audio"

class Recall(Base):
    __tablename__ = "recalls"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String, index=True)
    type = Column(Enum(RecallType))
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class HeatCache(Base):
    __tablename__ = "heat_cache"

    location_id = Column(String, primary_key=True, index=True)
    heat_score = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
