from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar_url = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    words = relationship("Word", back_populates="owner", cascade="all, delete-orphan")
    review_records = relationship("ReviewRecord", back_populates="user", cascade="all, delete-orphan")


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    word = Column(String(100), nullable=False)
    definition = Column(Text, nullable=False)
    corpus_id = Column(String(50), default="")
    example_sentence = Column(Text, default="")
    example_translation = Column(Text, default="")
    audio_url = Column(String(255), default="")
    master_count = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    forgetting_index = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_reviewed_at = Column(DateTime, nullable=True)

    owner = relationship("User", back_populates="words")
    review_records = relationship("ReviewRecord", back_populates="word", cascade="all, delete-orphan")


class ReviewRecord(Base):
    __tablename__ = "review_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    word_id = Column(Integer, ForeignKey("words.id"), nullable=False)
    is_mastered = Column(Integer, nullable=False)
    reviewed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="review_records")
    word = relationship("Word", back_populates="review_records")


class CorpusItem(Base):
    __tablename__ = "corpus_items"

    id = Column(Integer, primary_key=True, index=True)
    corpus_id = Column(String(50), unique=True, index=True, nullable=False)
    word = Column(String(100), nullable=False)
    example_sentence = Column(Text, nullable=False)
    example_translation = Column(Text, nullable=False)
    audio_url = Column(String(255), default="")
    source = Column(String(100), default="")
