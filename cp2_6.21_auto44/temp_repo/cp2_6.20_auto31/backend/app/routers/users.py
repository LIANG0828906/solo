import os
import random
import uuid
from datetime import datetime, timedelta, date
from pathlib import Path
from typing import List, Optional
from collections import defaultdict

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    Query,
    status,
)
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    User,
    Vinyl,
    PlayRecord,
    Friendship,
    Post,
)
from ..schemas import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    Token,
    TokenWithRefresh,
    VinylResponse,
    UserStatsResponse,
    PlayRecordHeatmapItem,
    WeeklyPlayTimeItem,
)
from ..utils import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token,
    DEFAULT_AVATARS,
    get_random_avatar,
    validate_upload_file,
    MAX_FILE_SIZE,
)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/auth/login", auto_error=False)

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"

REFRESH_TOKEN_EXPIRE_DAYS = 7


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


def create_refresh_token(data: dict) -> str:
    expires_delta = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return create_access_token(data, expires_delta)


def create_demo_data(db: Session, user: User):
    demo_titles_artists = [
        ("The Dark Side of the Moon", "Pink Floyd", "Rock", 1973, 9.5),
        ("Thriller", "Michael Jackson", "Pop", 1982, 9.0),
        ("Abbey Road", "The Beatles", "Rock", 1969, 9.3),
        ("Rumours", "Fleetwood Mac", "Rock", 1977, 8.9),
        ("What's Going On", "Marvin Gaye", "Soul", 1971, 9.1),
        ("Blue", "Joni Mitchell", "Folk", 1971, 8.8),
        ("Kind of Blue", "Miles Davis", "Jazz", 1959, 9.4),
        ("Nevermind", "Nirvana", "Grunge", 1991, 9.0),
    ]

    vinyls = []
    for title, artist, genre, year, rating in demo_titles_artists:
        v = Vinyl(
            title=title,
            artist=artist,
            genre=genre,
            release_year=year,
            rating=rating,
            notes=f"经典{genre}专辑，值得收藏",
            owner_id=user.id,
        )
        db.add(v)
        vinyls.append(v)
    db.commit()
    for v in vinyls:
        db.refresh(v)

    now = datetime.utcnow()
    for i in range(60):
        vinyl = random.choice(vinyls)
        days_ago = random.randint(0, 180)
        hours = random.randint(0, 23)
        minutes = random.randint(0, 59)
        played_at = now - timedelta(days=days_ago, hours=hours, minutes=minutes)
        pr = PlayRecord(
            user_id=user.id,
            vinyl_id=vinyl.id,
            played_at=played_at,
            duration_seconds=random.randint(120, 3600),
        )
        db.add(pr)

    genres = ["Rock", "Pop", "Jazz", "Electronic", "Hip-Hop", "Classical", "Soul", "Funk"]
    for i in range(5):
        name_suffix = random.choice(["Fan", "Lover", "Collector", "Enthusiast", "Addict"])
        f_user = User(
            username=f"{user.username}_{name_suffix}_{i+1}",
            email=f"{user.email.split('@')[0]}_friend{i+1}@{user.email.split('@')[1]}",
            hashed_password=hash_password("password123"),
            avatar_url=get_random_avatar(),
            bio=f"Hi, 我是{user.username}的好友，热爱{random.choice(genres)}音乐！",
        )
        db.add(f_user)
    db.commit()

    friend_users = (
        db.query(User)
        .filter(User.username.like(f"{user.username}_%"))
        .filter(User.id != user.id)
        .all()
    )
    for fu in friend_users:
        fs1 = Friendship(user_id=user.id, friend_id=fu.id)
        fs2 = Friendship(user_id=fu.id, friend_id=user.id)
        db.add(fs1)
        db.add(fs2)

    for v in vinyls[:3]:
        for fu in friend_users[:3]:
            if random.random() > 0.4:
                pr = PlayRecord(
                    user_id=fu.id,
                    vinyl_id=v.id,
                    played_at=now - timedelta(days=random.randint(1, 60)),
                    duration_seconds=random.randint(200, 3000),
                )
                db.add(pr)

    for v in vinyls[:4]:
        content = f"入手了新专辑《{v.title}》，分享给大家！"
        post = Post(
            user_id=user.id,
            vinyl_id=v.id,
            content=content,
            created_at=now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23)),
        )
        db.add(post)

    db.commit()


@router.post("/auth/register", response_model=dict, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    existing_username = db.query(User).filter(User.username == user_in.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    hashed = hash_password(user_in.password)
    avatar = user_in.avatar_url if user_in.avatar_url else get_random_avatar()

    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed,
        avatar_url=avatar,
        bio=user_in.bio,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    create_demo_data(db, user)

    access_token = create_access_token({"user_id": user.id})
    refresh_token = create_refresh_token({"user_id": user.id, "type": "refresh"})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user).model_dump(),
    }


@router.post("/auth/login", response_model=dict)
def login(
    user_in: UserLogin,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token({"user_id": user.id})
    refresh_token = create_refresh_token({"user_id": user.id, "type": "refresh"})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user).model_dump(),
    }


@router.post("/auth/refresh", response_model=Token)
def refresh_token(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    user_id = verify_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    new_access_token = create_access_token({"user_id": user.id})
    return Token(access_token=new_access_token, token_type="bearer")


@router.get("/preset-avatars", response_model=List[str])
def get_preset_avatars():
    return DEFAULT_AVATARS


@router.get("/{user_id}", response_model=dict)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    collection_count = db.query(func.count(Vinyl.id)).filter(Vinyl.owner_id == user_id).scalar() or 0
    total_plays = db.query(func.count(PlayRecord.id)).filter(PlayRecord.user_id == user_id).scalar() or 0

    rated_vinyls = (
        db.query(Vinyl)
        .filter(Vinyl.owner_id == user_id, Vinyl.rating.isnot(None))
        .all()
    )
    avg_rating = None
    if rated_vinyls:
        total_rating = sum(v.rating for v in rated_vinyls)
        avg_rating = round(total_rating / len(rated_vinyls), 2)

    genre_results = (
        db.query(Vinyl.genre, func.count(Vinyl.id))
        .filter(Vinyl.owner_id == user_id, Vinyl.genre.isnot(None))
        .group_by(Vinyl.genre)
        .all()
    )
    genre_distribution = {}
    for genre, count in genre_results:
        genre_distribution[genre] = count

    return {
        "user": UserResponse.model_validate(user).model_dump(),
        "stats": {
            "collection_count": collection_count,
            "total_plays": total_plays,
            "avg_rating": avg_rating,
            "genre_distribution": genre_distribution,
        },
    }


@router.put("/{user_id}", response_model=UserResponse)
async def update_user_profile(
    user_id: int,
    username: Optional[str] = Form(None, min_length=2, max_length=50),
    avatar: Optional[UploadFile] = File(None),
    bio: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this profile",
        )

    if username is not None and username != user.username:
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )
        user.username = username

    if bio is not None:
        user.bio = bio

    if avatar:
        validate_upload_file(avatar)

        file_bytes = await avatar.read()
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB",
            )

        ext = avatar.filename.rsplit(".", 1)[-1].lower()
        unique_name = f"avatar_{uuid.uuid4().hex}.{ext}"
        file_path = UPLOADS_DIR / unique_name
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        if user.avatar_url and user.avatar_url.startswith("/uploads/"):
            old_path = UPLOADS_DIR / user.avatar_url[len("/uploads/"):]
            if old_path.exists():
                try:
                    os.remove(old_path)
                except OSError:
                    pass

        user.avatar_url = f"/uploads/{unique_name}"

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.get("/{user_id}/play-records", response_model=dict)
def get_user_play_records(
    user_id: int,
    year: Optional[int] = Query(None, description="按年份筛选"),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    query = (
        db.query(PlayRecord)
        .filter(PlayRecord.user_id == user_id)
        .options(
            __import__("sqlalchemy.orm", fromlist=["joinedload"]).joinedload(PlayRecord.vinyl)
        )
    )

    if year:
        query = query.filter(extract("year", PlayRecord.played_at) == year)

    records = query.order_by(PlayRecord.played_at.desc()).all()

    date_map = defaultdict(lambda: {"count": 0, "vinyls": []})
    seen_vinyls = defaultdict(set)

    for r in records:
        d_str = r.played_at.strftime("%Y-%m-%d")
        date_map[d_str]["count"] += 1
        if r.vinyl and r.vinyl.id not in seen_vinyls[d_str]:
            date_map[d_str]["vinyls"].append(VinylResponse.model_validate(r.vinyl).model_dump())
            seen_vinyls[d_str].add(r.vinyl.id)

    items = []
    for d_str, data in sorted(date_map.items()):
        items.append({
            "date": d_str,
            "count": data["count"],
            "tracks": data["vinyls"],
        })

    return {"items": items}


@router.get("/{user_id}/weekly-play-time", response_model=List[WeeklyPlayTimeItem])
def get_user_weekly_play_time(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    now = datetime.utcnow()
    weeks = []
    for i in range(12):
        week_end = now - timedelta(days=i * 7)
        week_start = week_end - timedelta(days=6)
        week_label = f"{week_start.strftime('%m/%d')}-{week_end.strftime('%m/%d')}"

        records = (
            db.query(PlayRecord)
            .filter(
                PlayRecord.user_id == user_id,
                PlayRecord.played_at >= week_start,
                PlayRecord.played_at <= week_end,
            )
            .all()
        )

        total_seconds = sum(r.duration_seconds or 0 for r in records)
        hours = round(total_seconds / 3600, 2)

        weeks.append({"week": week_label, "hours": hours})

    return list(reversed(weeks))
