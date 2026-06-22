from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    is_expert = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    repairs = relationship("RepairRecord", back_populates="owner")


class Fragment(Base):
    __tablename__ = "fragments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    era = Column(String(100), index=True)
    material = Column(String(100), index=True)
    era_answer = Column(String(100))
    material_answer = Column(String(100))
    image_url = Column(String(500))
    location = Column(String(200))
    age_range = Column(String(100))
    condition = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    classifications = relationship("Classification", back_populates="fragment")


class Classification(Base):
    __tablename__ = "classifications"

    id = Column(Integer, primary_key=True, index=True)
    fragment_id = Column(Integer, ForeignKey("fragments.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    era_prediction = Column(String(100), nullable=False)
    material_prediction = Column(String(100), nullable=False)
    is_correct = Column(Boolean, default=False)
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    fragment = relationship("Fragment", back_populates="classifications")


class RepairRecord(Base):
    __tablename__ = "repair_records"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    fragment_id = Column(Integer, ForeignKey("fragments.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="draft")
    is_submitted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="repairs")
    steps = relationship("RepairStep", back_populates="record", cascade="all, delete-orphan")


class RepairStep(Base):
    __tablename__ = "repair_steps"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("repair_records.id"), nullable=False)
    step_order = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    tool_used = Column(String(200))
    duration_minutes = Column(Integer)
    notes = Column(Text)
    image_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    record = relationship("RepairRecord", back_populates="steps")
