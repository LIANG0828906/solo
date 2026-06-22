from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from database import Base


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    color = Column(String, nullable=True)
    x = Column(Float, default=0.0)
    y = Column(Float, default=0.0)
    z_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
