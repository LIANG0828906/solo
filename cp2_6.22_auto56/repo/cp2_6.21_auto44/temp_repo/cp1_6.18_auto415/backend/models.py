from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

DATABASE_URL = "sqlite:///./ciyingliusheng.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    works = relationship("Work", back_populates="user", cascade="all, delete-orphan")

class Work(Base):
    __tablename__ = "works"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False, default="未命名作品")
    duration = Column(Integer, default=0)
    audio_path = Column(String(512))
    image_path = Column(String(512))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="works")
    text_segments = relationship("TextSegment", back_populates="work", cascade="all, delete-orphan", order_by="TextSegment.order_index")
    share_link = relationship("ShareLink", back_populates="work", uselist=False, cascade="all, delete-orphan")

class TextSegment(Base):
    __tablename__ = "text_segments"
    
    id = Column(String(36), primary_key=True, index=True)
    work_id = Column(String(36), ForeignKey("works.id"), nullable=False)
    text = Column(Text, nullable=False)
    start_time = Column(Float, nullable=False, default=0.0)
    end_time = Column(Float, nullable=False, default=0.0)
    emotion = Column(String(20), default="neutral")
    confidence = Column(Float, default=0.5)
    order_index = Column(Integer, nullable=False, default=0)
    
    work = relationship("Work", back_populates="text_segments")

class ShareLink(Base):
    __tablename__ = "share_links"
    
    id = Column(String(36), primary_key=True, index=True)
    work_id = Column(String(36), ForeignKey("works.id"), nullable=False)
    share_token = Column(String(64), unique=True, index=True, nullable=False)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    
    work = relationship("Work", back_populates="share_link")

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
