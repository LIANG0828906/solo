from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Book, UserBook, Review
from schemas import (
    BookCreate, BookResponse, UserBookCreate, UserBookResponse,
    UserBookProgressUpdate, ReviewCreate, ReviewResponse
)
from auth import get_current_user

router = APIRouter(prefix="/books", tags=["books"])


@router.get("", response_model=List[BookResponse])
def get_books(
    skip: int = 0,
    limit: int = 20,
    search: str = "",
    db: Session = Depends(get_db)
):
    query = db.query(Book)
    if search:
        query = query.filter(
            (Book.title.contains(search)) | (Book.author.contains(search))
        )
    books = query.offset(skip).limit(limit).all()
    return books


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def add_book(
    book: BookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_book = Book(**book.model_dump(), user_id=current_user.id)
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book


@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    return book


@router.post("/{book_id}/progress", response_model=UserBookResponse)
def update_progress(
    book_id: int,
    progress_update: UserBookProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if progress_update.progress < 0 or progress_update.progress > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Progress must be between 0 and 100"
        )
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    user_book = db.query(UserBook).filter(
        UserBook.user_id == current_user.id,
        UserBook.book_id == book_id
    ).first()
    if not user_book:
        user_book = UserBook(user_id=current_user.id, book_id=book_id)
        db.add(user_book)
    user_book.progress = progress_update.progress
    db.commit()
    db.refresh(user_book)
    return user_book


@router.get("/{book_id}/reviews", response_model=List[ReviewResponse])
def get_reviews(
    book_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    reviews = db.query(Review).filter(Review.book_id == book_id)\
        .order_by(Review.created_at.desc())\
        .offset(skip).limit(limit).all()
    return reviews


@router.post("/{book_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def add_review(
    book_id: int,
    review: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    new_review = Review(
        book_id=book_id,
        user_id=current_user.id,
        content=review.content
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review
