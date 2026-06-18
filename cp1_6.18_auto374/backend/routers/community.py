from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Review, Event
from schemas import CommunityItem

router = APIRouter(prefix="/community", tags=["community"])


@router.get("/feed", response_model=List[CommunityItem])
def get_community_feed(
    skip: int = 0,
    limit: int = 30,
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).all()
    events = db.query(Event).all()

    feed_items = []

    for review in reviews:
        feed_items.append({
            "type": "review",
            "data": {
                "id": review.id,
                "content": review.content,
                "book_id": review.book_id,
                "user_id": review.user_id,
                "username": review.user.username if review.user else None
            },
            "created_at": review.created_at
        })

    for event in events:
        feed_items.append({
            "type": "event",
            "data": {
                "id": event.id,
                "title": event.title,
                "description": event.description,
                "location": event.location,
                "event_time": event.event_time,
                "status": event.status,
                "creator_id": event.creator_id,
                "creator_name": event.creator.username if event.creator else None
            },
            "created_at": event.created_at
        })

    feed_items.sort(key=lambda x: x["created_at"], reverse=True)
    return feed_items[skip: skip + limit]
