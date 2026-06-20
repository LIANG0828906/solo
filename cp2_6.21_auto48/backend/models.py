from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship

from database import Base


def utcnow():
    return datetime.now(timezone.utc)


class BoardRoom(Base):
    __tablename__ = "board_rooms"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    creatives = relationship("Creative", back_populates="board_room", cascade="all, delete-orphan")


class Creative(Base):
    __tablename__ = "creatives"

    id = Column(String, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    type = Column(String, nullable=False, default="idea")
    author = Column(String, nullable=False)
    votes = Column(Integer, default=0, nullable=False)
    voters = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    board_room_id = Column(String, ForeignKey("board_rooms.id"), nullable=False)
    created_by = Column(String, nullable=False)

    board_room = relationship("BoardRoom", back_populates="creatives")
