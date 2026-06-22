from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
    Form,
)
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import or_, func, desc
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Post,
    User,
    Vinyl,
    Friendship,
    Like,
    Comment,
)
from ..schemas import (
    PostResponse,
    UserResponse,
    VinylResponse,
    CommentResponse,
    CommentCreate,
    TrendingVinyl,
)
from ..utils import verify_access_token

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/auth/login", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = verify_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not token:
        return None
    user_id = verify_access_token(token)
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id).first()


def build_post_response(post: Post, current_user: Optional[User]) -> dict:
    likes_count = db_likes_count(post.id, post._sa_instance_state.session)
    comments = (
        post._sa_instance_state.session.query(Comment)
        .filter(Comment.post_id == post.id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    comments_data = []
    for c in comments:
        c_dict = CommentResponse.model_validate(c).model_dump()
        c_dict["user"] = UserResponse.model_validate(c.user).model_dump() if c.user else None
        comments_data.append(c_dict)

    is_liked = False
    if current_user:
        existing_like = (
            post._sa_instance_state.session.query(Like)
            .filter(Like.post_id == post.id, Like.user_id == current_user.id)
            .first()
        )
        is_liked = existing_like is not None

    post_dict = PostResponse.model_validate(post).model_dump()
    post_dict["likes_count"] = likes_count
    post_dict["comments_count"] = len(comments)
    post_dict["comments"] = comments_data
    post_dict["is_liked"] = is_liked
    post_dict["user"] = UserResponse.model_validate(post.user).model_dump() if post.user else None
    post_dict["vinyl"] = VinylResponse.model_validate(post.vinyl).model_dump() if post.vinyl else None
    return post_dict


def db_likes_count(post_id: int, db: Session) -> int:
    return db.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar() or 0


@router.get("/feed", response_model=dict)
def get_community_feed(
    page: int = Query(1, ge=1, description="页码"),
    limit: int = Query(10, ge=1, le=50, description="每页条数"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    friend_ids = [
        f.friend_id for f in db.query(Friendship).filter(Friendship.user_id == current_user.id).all()
    ]
    visible_user_ids = [current_user.id] + friend_ids

    query = db.query(Post).filter(Post.user_id.in_(visible_user_ids))
    total = query.count()

    offset = (page - 1) * limit
    posts = (
        query.order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = [build_post_response(p, current_user) for p in posts]

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.post("/posts/{post_id}/like", response_model=dict)
def toggle_post_like(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )

    existing_like = (
        db.query(Like)
        .filter(Like.post_id == post_id, Like.user_id == current_user.id)
        .first()
    )

    is_liked = False
    if existing_like:
        db.delete(existing_like)
        db.commit()
    else:
        new_like = Like(user_id=current_user.id, post_id=post_id)
        db.add(new_like)
        db.commit()
        is_liked = True

    likes_count = db_likes_count(post_id, db)

    return {
        "likes_count": likes_count,
        "is_liked": is_liked,
    }


@router.post("/posts/{post_id}/comment", response_model=dict, status_code=status.HTTP_201_CREATED)
def add_post_comment(
    post_id: int,
    content: str = Form(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )

    comment = Comment(
        user_id=current_user.id,
        post_id=post_id,
        content=content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    comment_dict = CommentResponse.model_validate(comment).model_dump()
    comment_dict["user"] = UserResponse.model_validate(current_user).model_dump()

    return comment_dict


@router.get("/posts/trending", response_model=List[TrendingVinyl])
def get_trending_vinyls(
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    results = (
        db.query(
            Vinyl.id,
            Vinyl.title,
            Vinyl.artist,
            Vinyl.genre,
            Vinyl.cover_url,
            func.count(Vinyl.id).label("add_count"),
        )
        .join(Post, Post.vinyl_id == Vinyl.id)
        .filter(Post.created_at >= week_ago)
        .group_by(Vinyl.id, Vinyl.title, Vinyl.artist, Vinyl.genre, Vinyl.cover_url)
        .order_by(desc("add_count"))
        .limit(10)
        .all()
    )

    trending = []
    for r in results:
        trending.append(TrendingVinyl(
            id=r.id,
            title=r.title,
            artist=r.artist,
            genre=r.genre,
            cover_url=r.cover_url,
            add_count=r.add_count,
        ))

    if not trending:
        all_results = (
            db.query(
                Vinyl.id,
                Vinyl.title,
                Vinyl.artist,
                Vinyl.genre,
                Vinyl.cover_url,
                func.count(Vinyl.id).label("add_count"),
            )
            .join(Post, Post.vinyl_id == Vinyl.id)
            .group_by(Vinyl.id, Vinyl.title, Vinyl.artist, Vinyl.genre, Vinyl.cover_url)
            .order_by(desc("add_count"))
            .limit(10)
            .all()
        )
        trending = [
            TrendingVinyl(
                id=r.id,
                title=r.title,
                artist=r.artist,
                genre=r.genre,
                cover_url=r.cover_url,
                add_count=r.add_count,
            )
            for r in all_results
        ]

    return trending
