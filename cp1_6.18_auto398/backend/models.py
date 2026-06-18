from sqlalchemy import Column, String, Integer, Boolean, Date, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base
import uuid
import json


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "avatarUrl": self.avatar_url,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class Book(Base):
    __tablename__ = "books"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    isbn = Column(String, nullable=True)
    title = Column(String, nullable=False)
    authors = Column(String, nullable=False, default='[]')
    cover_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    tags = Column(String, nullable=False, default='[]')
    rating = Column(Integer, nullable=True)
    status = Column(String, nullable=False, default="wishlist")
    pages_read = Column(Integer, nullable=False, default=0)
    total_pages = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "isbn": self.isbn,
            "title": self.title,
            "authors": json.loads(self.authors) if self.authors else [],
            "coverUrl": self.cover_url,
            "description": self.description,
            "tags": json.loads(self.tags) if self.tags else [],
            "rating": self.rating,
            "status": self.status,
            "pagesRead": self.pages_read,
            "totalPages": self.total_pages,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class BookShelf(Base):
    __tablename__ = "book_shelves"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    theme = Column(String, nullable=True)
    book_ids = Column(String, nullable=False, default='[]')
    cover_mosaic = Column(String, nullable=False, default='[]')
    is_public = Column(Boolean, nullable=False, default=False)
    likes_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self, include_comments=False, db=None):
        data = {
            "id": self.id,
            "userId": self.user_id,
            "name": self.name,
            "description": self.description,
            "theme": self.theme,
            "bookIds": json.loads(self.book_ids) if self.book_ids else [],
            "coverMosaic": json.loads(self.cover_mosaic) if self.cover_mosaic else [],
            "isPublic": self.is_public,
            "likes": self.likes_count,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
        if include_comments and db:
            comments = db.query(Comment).filter(Comment.shelf_id == self.id).all()
            data["comments"] = [c.to_dict() for c in comments]
        else:
            data["comments"] = []
        return data


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String, primary_key=True, default=generate_uuid)
    shelf_id = Column(String, ForeignKey("book_shelves.id"), nullable=False, index=True)
    guest_name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "shelfId": self.shelf_id,
            "username": self.guest_name,
            "content": self.content,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class ReadingChallenge(Base):
    __tablename__ = "reading_challenges"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    target_books = Column(Integer, nullable=False)
    current_books = Column(Integer, nullable=False, default=0)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "title": self.title,
            "targetBooks": self.target_books,
            "currentBooks": self.current_books,
            "startDate": self.start_date.isoformat() if self.start_date else None,
            "endDate": self.end_date.isoformat() if self.end_date else None,
        }
