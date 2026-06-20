from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)
    full_name = Column(String)
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)
    student_bookings = relationship("Booking", foreign_keys="Booking.student_id", back_populates="student")
    student_reviews = relationship("Review", foreign_keys="Review.student_id", back_populates="student")


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subjects = Column(String)
    bio = Column(Text)
    education = Column(String)
    experience_years = Column(Integer)
    rating = Column(Float, default=0)
    review_count = Column(Integer, default=0)
    hourly_rate = Column(Float)

    user = relationship("User", back_populates="teacher_profile")
    time_slots = relationship("TimeSlot", back_populates="teacher", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="teacher", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="teacher", cascade="all, delete-orphan")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(String, default="pending")
    subject = Column(String)
    notes = Column(Text, nullable=True)

    teacher = relationship("Teacher", back_populates="bookings")
    student = relationship("User", foreign_keys=[student_id], back_populates="student_bookings")
    review = relationship("Review", back_populates="booking", uselist=False)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(Integer)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="review")
    teacher = relationship("Teacher", back_populates="reviews")
    student = relationship("User", foreign_keys=[student_id], back_populates="student_reviews")


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    is_available = Column(Boolean, default=True)

    teacher = relationship("Teacher", back_populates="time_slots")
