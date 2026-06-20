from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

from database import get_db
from models import Booking, User, Teacher, Review, TimeSlot
from routes.auth import get_current_user

router = APIRouter(prefix="/bookings", tags=["bookings"])


class BookingCreate(BaseModel):
    teacher_id: int
    start_time: datetime
    end_time: datetime
    subject: str
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    id: int
    teacher_id: int
    student_id: int
    start_time: datetime
    end_time: datetime
    status: str
    subject: str
    notes: Optional[str] = None
    teacher_name: Optional[str] = None
    student_name: Optional[str] = None
    hourly_rate: Optional[float] = None

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
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

    class Config:
        from_attributes = True


@router.post("", response_model=BookingResponse)
def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "parent":
        raise HTTPException(status_code=403, detail="Only parents can create bookings")

    teacher = db.query(Teacher).filter(Teacher.id == booking_data.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    if booking_data.start_time >= booking_data.end_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    overlapping_booking = db.query(Booking).filter(
        Booking.teacher_id == booking_data.teacher_id,
        Booking.status.in_(["pending", "confirmed"]),
        Booking.start_time < booking_data.end_time,
        Booking.end_time > booking_data.start_time
    ).first()

    if overlapping_booking:
        raise HTTPException(status_code=400, detail="Time slot is already booked")

    time_slot = db.query(TimeSlot).filter(
        TimeSlot.teacher_id == booking_data.teacher_id,
        TimeSlot.start_time == booking_data.start_time,
        TimeSlot.end_time == booking_data.end_time,
        TimeSlot.is_available == True
    ).first()

    if time_slot:
        time_slot.is_available = False

    new_booking = Booking(
        teacher_id=booking_data.teacher_id,
        student_id=current_user.id,
        start_time=booking_data.start_time,
        end_time=booking_data.end_time,
        status="pending",
        subject=booking_data.subject,
        notes=booking_data.notes
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    teacher_user = db.query(User).filter(User.id == teacher.user_id).first()

    return BookingResponse(
        id=new_booking.id,
        teacher_id=new_booking.teacher_id,
        student_id=new_booking.student_id,
        start_time=new_booking.start_time,
        end_time=new_booking.end_time,
        status=new_booking.status,
        subject=new_booking.subject,
        notes=new_booking.notes,
        teacher_name=teacher_user.full_name if teacher_user else None,
        student_name=current_user.full_name,
        hourly_rate=teacher.hourly_rate
    )


@router.get("", response_model=List[BookingResponse])
def list_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "parent":
        bookings = db.query(Booking).filter(
            Booking.student_id == current_user.id
        ).order_by(Booking.start_time.desc()).all()
    elif current_user.role == "teacher":
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        if not teacher:
            return []
        bookings = db.query(Booking).filter(
            Booking.teacher_id == teacher.id
        ).order_by(Booking.start_time.desc()).all()
    else:
        return []

    result = []
    for booking in bookings:
        teacher = db.query(Teacher).filter(Teacher.id == booking.teacher_id).first()
        teacher_user = db.query(User).filter(User.id == teacher.user_id).first() if teacher else None
        student = db.query(User).filter(User.id == booking.student_id).first()

        booking_data = BookingResponse(
            id=booking.id,
            teacher_id=booking.teacher_id,
            student_id=booking.student_id,
            start_time=booking.start_time,
            end_time=booking.end_time,
            status=booking.status,
            subject=booking.subject,
            notes=booking.notes,
            teacher_name=teacher_user.full_name if teacher_user else None,
            student_name=student.full_name if student else None,
            hourly_rate=teacher.hourly_rate if teacher else None
        )
        result.append(booking_data)

    return result


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user.role == "parent" and booking.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this booking")

    if current_user.role == "teacher":
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        if not teacher or booking.teacher_id != teacher.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this booking")

    teacher = db.query(Teacher).filter(Teacher.id == booking.teacher_id).first()
    teacher_user = db.query(User).filter(User.id == teacher.user_id).first() if teacher else None
    student = db.query(User).filter(User.id == booking.student_id).first()

    return BookingResponse(
        id=booking.id,
        teacher_id=booking.teacher_id,
        student_id=booking.student_id,
        start_time=booking.start_time,
        end_time=booking.end_time,
        status=booking.status,
        subject=booking.subject,
        notes=booking.notes,
        teacher_name=teacher_user.full_name if teacher_user else None,
        student_name=student.full_name if student else None,
        hourly_rate=teacher.hourly_rate if teacher else None
    )


@router.put("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user.role == "parent" and booking.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")

    if current_user.role == "teacher":
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        if not teacher or booking.teacher_id != teacher.id:
            raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")

    if booking.status in ["cancelled", "completed"]:
        raise HTTPException(status_code=400, detail="Booking cannot be cancelled")

    booking.status = "cancelled"

    time_slot = db.query(TimeSlot).filter(
        TimeSlot.teacher_id == booking.teacher_id,
        TimeSlot.start_time == booking.start_time,
        TimeSlot.end_time == booking.end_time
    ).first()

    if time_slot:
        time_slot.is_available = True

    db.commit()
    db.refresh(booking)

    teacher = db.query(Teacher).filter(Teacher.id == booking.teacher_id).first()
    teacher_user = db.query(User).filter(User.id == teacher.user_id).first() if teacher else None
    student = db.query(User).filter(User.id == booking.student_id).first()

    return BookingResponse(
        id=booking.id,
        teacher_id=booking.teacher_id,
        student_id=booking.student_id,
        start_time=booking.start_time,
        end_time=booking.end_time,
        status=booking.status,
        subject=booking.subject,
        notes=booking.notes,
        teacher_name=teacher_user.full_name if teacher_user else None,
        student_name=student.full_name if student else None,
        hourly_rate=teacher.hourly_rate if teacher else None
    )


@router.put("/{booking_id}/confirm", response_model=BookingResponse)
def confirm_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can confirm bookings")

    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.teacher_id != teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to confirm this booking")

    if booking.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending bookings can be confirmed")

    booking.status = "confirmed"
    db.commit()
    db.refresh(booking)

    teacher_user = db.query(User).filter(User.id == teacher.user_id).first()
    student = db.query(User).filter(User.id == booking.student_id).first()

    return BookingResponse(
        id=booking.id,
        teacher_id=booking.teacher_id,
        student_id=booking.student_id,
        start_time=booking.start_time,
        end_time=booking.end_time,
        status=booking.status,
        subject=booking.subject,
        notes=booking.notes,
        teacher_name=teacher_user.full_name if teacher_user else None,
        student_name=student.full_name if student else None,
        hourly_rate=teacher.hourly_rate
    )


@router.post("/{booking_id}/review", response_model=ReviewResponse)
def add_review(
    booking_id: int,
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

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to review this booking")

    if booking.status != "completed" and booking.status != "confirmed":
        raise HTTPException(status_code=400, detail="Only completed or confirmed bookings can be reviewed")

    existing_review = db.query(Review).filter(Review.booking_id == booking_id).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="Review already exists for this booking")

    new_review = Review(
        booking_id=booking_id,
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

    booking.status = "completed"

    db.commit()
    db.refresh(new_review)

    return new_review
