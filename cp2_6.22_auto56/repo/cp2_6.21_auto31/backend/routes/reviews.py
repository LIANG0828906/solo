from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

from database import get_db
from models import Booking, User, Teacher, Review
from routes.auth import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewCreate(BaseModel):
    booking_id: int
    rating: int
    comment: str


class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    teacher_id: int
    student_id: int
    rating: int
    comment: str
    created_at: datetime
    student_name: Optional[str] = None

    class Config:
        from_attributes = True


@router.post("", response_model=ReviewResponse)
def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "parent":
        raise HTTPException(status_code=403, detail="Only parents can add reviews")

    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    if len(review_data.comment) > 200:
        raise HTTPException(status_code=400, detail="Comment must be less than 200 characters")

    booking = db.query(Booking).filter(Booking.id == review_data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the student who booked this lesson can review")

    if booking.status != "completed" and booking.status != "confirmed":
        raise HTTPException(status_code=400, detail="Only completed or confirmed bookings can be reviewed")

    existing_review = db.query(Review).filter(Review.booking_id == review_data.booking_id).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="Review already exists for this booking")

    new_review = Review(
        booking_id=review_data.booking_id,
        teacher_id=booking.teacher_id,
        student_id=current_user.id,
        rating=review_data.rating,
        comment=review_data.comment,
        created_at=datetime.utcnow()
    )
    db.add(new_review)

    teacher = db.query(Teacher).filter(Teacher.id == booking.teacher_id).first()
    if teacher:
        total_rating = teacher.rating * teacher.review_count + review_data.rating
        teacher.review_count += 1
        teacher.rating = round(total_rating / teacher.review_count, 1)

    db.commit()
    db.refresh(new_review)

    student = db.query(User).filter(User.id == current_user.id).first()
    return ReviewResponse(
        id=new_review.id,
        booking_id=new_review.booking_id,
        teacher_id=new_review.teacher_id,
        student_id=new_review.student_id,
        rating=new_review.rating,
        comment=new_review.comment,
        created_at=new_review.created_at,
        student_name=student.full_name if student else None
    )


@router.get("/my-teacher", response_model=List[ReviewResponse])
def get_my_teacher_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view their reviews")

    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    reviews = db.query(Review).filter(
        Review.teacher_id == teacher.id
    ).order_by(Review.created_at.desc()).all()

    result = []
    for review in reviews:
        student = db.query(User).filter(User.id == review.student_id).first()
        result.append(ReviewResponse(
            id=review.id,
            booking_id=review.booking_id,
            teacher_id=review.teacher_id,
            student_id=review.student_id,
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
            student_name=student.full_name if student else None
        ))
    return result


@router.get("/teacher/{teacher_id}", response_model=List[ReviewResponse])
def get_teacher_reviews(
    teacher_id: int,
    db: Session = Depends(get_db)
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    reviews = db.query(Review).filter(
        Review.teacher_id == teacher_id
    ).order_by(Review.created_at.desc()).all()

    result = []
    for review in reviews:
        student = db.query(User).filter(User.id == review.student_id).first()
        result.append(ReviewResponse(
            id=review.id,
            booking_id=review.booking_id,
            teacher_id=review.teacher_id,
            student_id=review.student_id,
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
            student_name=student.full_name if student else None
        ))
    return result
