import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    style_preference = Column(String)
    height = Column(Float)
    weight = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    clothing_items = relationship("ClothingItem", back_populates="owner", cascade="all, delete-orphan")
    outfits = relationship("Outfit", back_populates="owner", cascade="all, delete-orphan")


class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)
    name = Column(String, nullable=False)
    season = Column(String)
    color = Column(String)
    is_virtual = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="clothing_items")


class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    top_id = Column(String, ForeignKey("clothing_items.id"))
    bottom_id = Column(String, ForeignKey("clothing_items.id"))
    shoes_id = Column(String, ForeignKey("clothing_items.id"))
    accessory_id = Column(String, ForeignKey("clothing_items.id"))
    reason = Column(String)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="outfits")
    top = relationship("ClothingItem", foreign_keys=[top_id])
    bottom = relationship("ClothingItem", foreign_keys=[bottom_id])
    shoes = relationship("ClothingItem", foreign_keys=[shoes_id])
    accessory = relationship("ClothingItem", foreign_keys=[accessory_id])
