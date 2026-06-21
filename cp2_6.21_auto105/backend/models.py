from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar = Column(String(255), default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trips = relationship("Trip", back_populates="owner")
    comments = relationship("Comment", back_populates="user")
    likes = relationship("Like", back_populates="user")
    favorites = relationship("Favorite", back_populates="user")
    collaborations = relationship("Collaborator", back_populates="user")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    cover_image = Column(String(255), default="")
    is_public = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="trips")
    day_plans = relationship("DayPlan", back_populates="trip", cascade="all, delete-orphan")
    attractions = relationship("Attraction", back_populates="trip", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="trip", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="trip", cascade="all, delete-orphan")
    collaborators = relationship("Collaborator", back_populates="trip", cascade="all, delete-orphan")


class DayPlan(Base):
    __tablename__ = "day_plans"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    day_number = Column(Integer, nullable=False)
    date = Column(String(20), default="")
    notes = Column(Text, default="")

    trip = relationship("Trip", back_populates="day_plans")
    attractions = relationship("Attraction", back_populates="day_plan", cascade="all, delete-orphan")


class Attraction(Base):
    __tablename__ = "attractions"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    day_plan_id = Column(Integer, ForeignKey("day_plans.id"), nullable=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, default="")
    location = Column(String(255), default="")
    image_url = Column(String(255), default="")
    order_index = Column(Integer, default=0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="attractions")
    day_plan = relationship("DayPlan", back_populates="attractions")
    comments = relationship("Comment", back_populates="attraction", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    attraction_id = Column(Integer, ForeignKey("attractions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    attraction = relationship("Attraction", back_populates="comments")
    user = relationship("User", back_populates="comments")


class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="likes")
    user = relationship("User", back_populates="likes")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="favorites")
    user = relationship("User", back_populates="favorites")


class Collaborator(Base):
    __tablename__ = "collaborators"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(50), default="editor")
    invited_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="collaborators")
    user = relationship("User", back_populates="collaborations")
