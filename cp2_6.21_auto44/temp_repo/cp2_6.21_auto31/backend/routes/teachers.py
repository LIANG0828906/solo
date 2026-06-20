from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta, date
from typing import List, Optional

from database import get_db
from models import Teacher, User, TimeSlot, Review, Booking
from routes.auth import get_current_user

router = APIRouter(prefix="/teachers", tags=["teachers"])


class TeacherResponse(BaseModel):
    id: int
    user_id: int
    subjects: str
    bio: str
    education: str
    experience_years: int
    rating: float
    review_count: int
    hourly_rate: float
    full_name: Optional[str] = None
    avatar: Optional[str] = None

    class Config:
        from_attributes = True


class TimeSlotResponse(BaseModel):
    id: int
    teacher_id: int
    start_time: datetime
    end_time: datetime
    is_available: bool

    class Config:
        from_attributes = True


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


class TimeSlotCreate(BaseModel):
    dates: List[str]
    start_hour: int
    end_hour: int


def teacher_to_response(teacher: Teacher) -> TeacherResponse:
    return TeacherResponse(
        id=teacher.id,
        user_id=teacher.user_id,
        subjects=teacher.subjects,
        bio=teacher.bio,
        education=teacher.education,
        experience_years=teacher.experience_years,
        rating=teacher.rating,
        review_count=teacher.review_count,
        hourly_rate=teacher.hourly_rate,
        full_name=teacher.user.full_name if teacher.user else None,
        avatar=teacher.user.avatar if teacher.user else None
    )


@router.get("", response_model=List[TeacherResponse])
def list_teachers(
    q: Optional[str] = None,
    subject: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Teacher).join(User)

    if q:
        query = query.filter(
            (User.full_name.contains(q)) |
            (Teacher.subjects.contains(q)) |
            (Teacher.bio.contains(q))
        )

    if subject:
        query = query.filter(Teacher.subjects.contains(subject))

    teachers = query.all()
    return [teacher_to_response(t) for t in teachers]


@router.get("/{teacher_id}", response_model=TeacherResponse)
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher_to_response(teacher)


@router.get("/{teacher_id}/timeslots", response_model=List[TimeSlotResponse])
def get_teacher_timeslots(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    today = datetime.utcnow().date()
    end_date = today + timedelta(days=7)

    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(end_date, datetime.max.time())

    timeslots = db.query(TimeSlot).filter(
        TimeSlot.teacher_id == teacher_id,
        TimeSlot.start_time >= start_of_day,
        TimeSlot.start_time <= end_of_day,
        TimeSlot.is_available == True
    ).order_by(TimeSlot.start_time).all()

    return timeslots


@router.get("/{teacher_id}/reviews", response_model=List[ReviewResponse])
def get_teacher_reviews(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    reviews = db.query(Review).filter(
        Review.teacher_id == teacher_id
    ).order_by(Review.created_at.desc()).all()

    result = []
    for review in reviews:
        student = db.query(User).filter(User.id == review.student_id).first()
        review_data = ReviewResponse(
            id=review.id,
            booking_id=review.booking_id,
            teacher_id=review.teacher_id,
            student_id=review.student_id,
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
            student_name=student.full_name if student else None
        )
        result.append(review_data)

    return result


@router.post("/timeslots", response_model=List[TimeSlotResponse])
def set_teacher_timeslots(
    timeslot_data: TimeSlotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can set time slots")

    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    created_slots = []

    for date_str in timeslot_data.dates:
        try:
            slot_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {date_str}")

        for hour in range(timeslot_data.start_hour, timeslot_data.end_hour):
            start_time = datetime.combine(slot_date, datetime.min.time()) + timedelta(hours=hour)
            end_time = start_time + timedelta(hours=1)

            existing_slot = db.query(TimeSlot).filter(
                TimeSlot.teacher_id == teacher.id,
                TimeSlot.start_time == start_time
            ).first()

            if existing_slot:
                existing_slot.is_available = True
                created_slots.append(existing_slot)
            else:
                new_slot = TimeSlot(
                    teacher_id=teacher.id,
                    start_time=start_time,
                    end_time=end_time,
                    is_available=True
                )
                db.add(new_slot)
                created_slots.append(new_slot)

    db.commit()
    for slot in created_slots:
        db.refresh(slot)

    return created_slots
