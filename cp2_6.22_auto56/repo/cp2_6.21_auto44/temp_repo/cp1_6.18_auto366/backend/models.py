from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    title = Column(String(20), nullable=False)
    description = Column(Text, nullable=False, default="")
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    notes = relationship("Note", back_populates="project", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="project", cascade="all, delete-orphan")
    mindmap = relationship("MindMap", back_populates="project", uselist=False, cascade="all, delete-orphan")


class Note(Base):
    __tablename__ = "notes"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    excerpt = Column(Text, nullable=False)
    reflection = Column(Text, nullable=False, default="")
    tags = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="notes")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    nickname = Column(String, nullable=False)
    avatar_color = Column(String, nullable=False)
    content = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="comments")


class MindMap(Base):
    __tablename__ = "mindmaps"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, unique=True)
    nodes_data = Column(Text, nullable=False, default="[]")
    edges_data = Column(Text, nullable=False, default="[]")

    project = relationship("Project", back_populates="mindmap")
