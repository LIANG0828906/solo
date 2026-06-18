from datetime import datetime, timedelta
from typing import List, Set
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import BookList, Book, User, get_db
from auth import get_current_user

router = APIRouter(prefix="/api/recommend", tags=["recommend"])


def get_user_tags_and_progress(user_id: int, db: Session) -> tuple:
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    booklists = db.query(BookList).filter(BookList.user_id == user_id).all()

    tags: Set[str] = set()
    weighted_progress = {}

    for bl in booklists:
        for b in bl.books:
            if b.added_at >= thirty_days_ago:
                if b.tags:
                    for tag in b.tags.split(","):
                        tag = tag.strip()
                        if tag:
                            tags.add(tag)
                if b.title:
                    weighted_progress[b.title] = b.progress

    return tags, weighted_progress


def jaccard_similarity(set_a: Set[str], set_b: Set[str]) -> float:
    if not set_a and not set_b:
        return 0.0
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return intersection / union if union > 0 else 0.0


def progress_similarity(prog_a: dict, prog_b: dict) -> float:
    common_books = set(prog_a.keys()) & set(prog_b.keys())
    if not common_books:
        return 0.0
    total_diff = 0.0
    for book in common_books:
        total_diff += abs(prog_a[book] - prog_b[book]) / 100.0
    avg_diff = total_diff / len(common_books)
    return 1.0 - avg_diff


def serialize_booklist(bl: BookList) -> dict:
    return {
        "id": bl.id,
        "name": bl.name,
        "description": bl.description,
        "cover_color": bl.cover_color,
        "is_public": bl.is_public,
        "user_id": bl.user_id,
        "user": {
            "id": bl.user.id,
            "username": bl.user.username,
        } if bl.user else None,
        "books": [
            {
                "id": b.id,
                "title": b.title,
                "author": b.author,
                "cover_url": b.cover_url,
                "progress": b.progress,
            }
            for b in bl.books
        ],
        "created_at": bl.created_at,
        "updated_at": bl.updated_at,
    }


@router.get("")
def get_recommendations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    my_tags, my_progress = get_user_tags_and_progress(current_user.id, db)

    all_users = db.query(User).filter(User.id != current_user.id).all()

    user_scores = []
    for u in all_users:
        u_tags, u_progress = get_user_tags_and_progress(u.id, db)
        tag_sim = jaccard_similarity(my_tags, u_tags)
        prog_sim = progress_similarity(my_progress, u_progress)
        total_sim = tag_sim * 0.6 + prog_sim * 0.4
        if total_sim > 0:
            user_scores.append((u.id, total_sim))

    user_scores.sort(key=lambda x: x[1], reverse=True)
    top_users = user_scores[:5]

    recommendations = []
    for user_id, score in top_users:
        public_booklists = (
            db.query(BookList)
            .filter(BookList.user_id == user_id, BookList.is_public == True)
            .order_by(BookList.updated_at.desc())
            .limit(3)
            .all()
        )
        for bl in public_booklists:
            rec = serialize_booklist(bl)
            rec["similarity_score"] = round(score, 4)
            recommendations.append(rec)

    if not recommendations:
        public_booklists = (
            db.query(BookList)
            .filter(BookList.is_public == True, BookList.user_id != current_user.id)
            .order_by(BookList.updated_at.desc())
            .limit(10)
            .all()
        )
        recommendations = [serialize_booklist(bl) for bl in public_booklists]

    return recommendations
