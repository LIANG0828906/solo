from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.dialects.sqlite import JSON
from database import Base


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(String)
    image = Column(String, nullable=True)
    tags = Column(JSON)
    category = Column(String)
    related_cards = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
