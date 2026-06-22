import uuid
from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from database import Base


class CafeMenu(Base):
    __tablename__ = "cafe_menus"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True, nullable=False)
    origin = Column(String, nullable=False)
    roast_level = Column(String, nullable=False)
    flavor_description = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    rating = Column(Integer, nullable=False)
    flavor_profile = Column(JSON, nullable=False)

    roasting_records = relationship("RoastingRecord", back_populates="cafe_menu", cascade="all, delete-orphan")


class RoastingRecord(Base):
    __tablename__ = "roasting_records"

    id = Column(Integer, primary_key=True, index=True)
    cafe_menu_id = Column(String, ForeignKey("cafe_menus.id"), nullable=False)
    time_sec = Column(Integer, nullable=False)
    temperature = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)

    cafe_menu = relationship("CafeMenu", back_populates="roasting_records")
