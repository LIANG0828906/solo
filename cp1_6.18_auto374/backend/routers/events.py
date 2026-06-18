from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Event, EventParticipant, Book
from schemas import EventCreate, EventResponse, EventParticipantResponse
from auth import get_current_user

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=List[EventResponse])
def get_events(
    skip: int = 0,
    limit: int = 20,
    status_filter: str = "",
    db: Session = Depends(get_db)
):
    query = db.query(Event)
    if status_filter:
        query = query.filter(Event.status == status_filter)
    events = query.order_by(Event.event_time.desc())\
        .offset(skip).limit(limit).all()
    return events


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if event.book_id:
        book = db.query(Book).filter(Book.id == event.book_id).first()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book not found"
            )
    new_event = Event(**event.model_dump(), creator_id=current_user.id)
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    return event


@router.post("/{event_id}/join", response_model=EventParticipantResponse, status_code=status.HTTP_201_CREATED)
def join_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    existing = db.query(EventParticipant).filter(
        EventParticipant.event_id == event_id,
        EventParticipant.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already joined this event"
        )
    participant = EventParticipant(
        event_id=event_id,
        user_id=current_user.id
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant
