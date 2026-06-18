from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    diaries = relationship("Diary", back_populates="owner")
    comments = relationship("Comment", back_populates="user")


class Diary(Base):
    __tablename__ = "diaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    audio_path = Column(String(255), nullable=True)
    text_content = Column(String(2000), nullable=False)
    is_public = Column(Boolean, default=False)
    emotion_x = Column(Float, default=50.0)
    emotion_y = Column(Float, default=50.0)
    emotion_type = Column(String(20), default="平静")
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="diaries")
    comments = relationship("Comment", back_populates="diary", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    diary_id = Column(Integer, ForeignKey("diaries.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    diary = relationship("Diary", back_populates="comments")
    user = relationship("User", back_populates="comments")
