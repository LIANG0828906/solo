from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "nord_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    books = relationship("UserBook", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    events_created = relationship("Event", back_populates="creator")
    events_joined = relationship("EventParticipant", back_populates="user")


class Book(Base):
    __tablename__ = "nord_books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    author = Column(String, index=True, nullable=False)
    isbn = Column(String, unique=True, index=True)
    cover_url = Column(String)
    description = Column(Text)
    user_id = Column(Integer, ForeignKey("nord_users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_books = relationship("UserBook", back_populates="book")
    reviews = relationship("Review", back_populates="book")
    events = relationship("Event", back_populates="book")


class UserBook(Base):
    __tablename__ = "nord_user_books"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("nord_users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("nord_books.id"), nullable=False)
    progress = Column(Integer, default=0)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="books")
    book = relationship("Book", back_populates="user_books")


class Review(Base):
    __tablename__ = "nord_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("nord_users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("nord_books.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reviews")
    book = relationship("Book", back_populates="reviews")


class Event(Base):
    __tablename__ = "nord_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text)
    location = Column(String)
    event_time = Column(DateTime(timezone=True), nullable=False)
    book_id = Column(Integer, ForeignKey("nord_books.id"))
    creator_id = Column(Integer, ForeignKey("nord_users.id"), nullable=False)
    status = Column(String, default="upcoming")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    book = relationship("Book", back_populates="events")
    creator = relationship("User", back_populates="events_created")
    participants = relationship("EventParticipant", back_populates="event")


class EventParticipant(Base):
    __tablename__ = "nord_event_participants"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("nord_events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("nord_users.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="participants")
    user = relationship("User", back_populates="events_joined")
