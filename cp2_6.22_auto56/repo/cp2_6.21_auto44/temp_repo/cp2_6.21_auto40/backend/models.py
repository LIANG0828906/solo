from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bean_type = Column(String(50), nullable=False)
    roast_level = Column(String(20), nullable=False)
    charge_temp = Column(Float, nullable=False)
    drop_temp = Column(Float, nullable=False)
    total_time = Column(Float, nullable=False)
    curve_data = Column(Text, nullable=False)
    markers = Column(Text, default="[]")
    is_public = Column(Boolean, default=True)
    rating = Column(Integer, default=3)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    taste_notes = relationship("TasteNote", back_populates="batch", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="batch", cascade="all, delete-orphan")


class TasteNote(Base):
    __tablename__ = "taste_notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    category = Column(String(50), nullable=False)
    sub_flavors = Column(Text, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    batch = relationship("Batch", back_populates="taste_notes")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    content = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    batch = relationship("Batch", back_populates="comments")
