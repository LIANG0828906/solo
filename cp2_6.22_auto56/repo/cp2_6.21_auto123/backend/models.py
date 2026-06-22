import random
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship

from .database import Base

TAG_COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c"]


def get_random_color():
    return random.choice(TAG_COLORS)


def generate_uuid():
    return str(uuid.uuid4())


snippet_tag = Table(
    "snippet_tag",
    Base.metadata,
    Column("snippet_id", String(36), ForeignKey("snippets.id"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("tags.id"), primary_key=True),
)


class Snippet(Base):
    __tablename__ = "snippets"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    title = Column(String(255), nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String(50), default="javascript")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tags = relationship("Tag", secondary=snippet_tag, back_populates="snippets")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    color = Column(String(7), default=get_random_color)
    created_at = Column(DateTime, default=datetime.utcnow)

    snippets = relationship("Snippet", secondary=snippet_tag, back_populates="tags")
