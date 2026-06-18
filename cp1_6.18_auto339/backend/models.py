from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./bookstation.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    booklists = relationship("BookList", back_populates="user")


class BookList(Base):
    __tablename__ = "booklists"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(30), nullable=False)
    description = Column(String(200), default="")
    cover_color = Column(String(7), default="#4ECDC4")
    is_public = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="booklists")
    books = relationship("Book", back_populates="booklist", cascade="all, delete-orphan")


class Book(Base):
    __tablename__ = "books"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    author = Column(String(100), nullable=False)
    cover_url = Column(String(500), nullable=True)
    tags = Column(String(500), default="")
    progress = Column(Integer, default=0)
    notes = Column(Text, default="")
    booklist_id = Column(Integer, ForeignKey("booklists.id"))
    added_at = Column(DateTime, default=datetime.utcnow)

    booklist = relationship("BookList", back_populates="books")


class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    target_booklist_id = Column(Integer, ForeignKey("booklists.id"))
    similarity_score = Column(Float, default=0.0)
    calculated_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)
