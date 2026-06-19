import os
import uuid
from pathlib import Path
from typing import List, Optional

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
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Vinyl, User, PlayRecord, Post, Friendship
from ..schemas import (
    VinylResponse,
    VinylDetailResponse,
    VinylUpdate,
    UserResponse,
    PostResponse,
)
from ..utils import (
    verify_access_token,
    validate_upload_file,
    MAX_FILE_SIZE,
)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/auth/login", auto_error=False)

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"


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


def verify_vinyl_owner(vinyl: Vinyl, user: User):
    if vinyl.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action",
        )


@router.get("", response_model=dict)
def get_vinyls(
    search: Optional[str] = Query(None, description="按标题/艺术家模糊查询"),
    genre: Optional[str] = Query(None, description="流派筛选"),
    page: int = Query(1, ge=1, description="页码"),
    limit: int = Query(20, ge=1, le=100, description="每页条数"),
    db: Session = Depends(get_db),
):
    query = db.query(Vinyl)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Vinyl.title.ilike(search_pattern),
                Vinyl.artist.ilike(search_pattern),
            )
        )

    if genre:
        query = query.filter(Vinyl.genre == genre)

    total = query.count()
    offset = (page - 1) * limit
    vinyls = query.order_by(Vinyl.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "items": [VinylResponse.model_validate(v).model_dump() for v in vinyls],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.get("/search", response_model=dict)
def search_vinyls(
    search: Optional[str] = Query(None),
    genre: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Vinyl.id, Vinyl.title, Vinyl.artist, Vinyl.genre, Vinyl.cover_url, Vinyl.owner_id)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Vinyl.title.ilike(search_pattern),
                Vinyl.artist.ilike(search_pattern),
            )
        )

    if genre:
        query = query.filter(Vinyl.genre == genre)

    total = query.count()
    offset = (page - 1) * limit
    results = query.order_by(Vinyl.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for r in results:
        items.append({
            "id": r.id,
            "title": r.title,
            "artist": r.artist,
            "genre": r.genre,
            "cover_url": r.cover_url,
            "owner_id": r.owner_id,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/{vinyl_id}", response_model=dict)
def get_vinyl_detail(
    vinyl_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(lambda: None),
    token: Optional[str] = Depends(oauth2_scheme),
):
    vinyl = db.query(Vinyl).filter(Vinyl.id == vinyl_id).first()
    if vinyl is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vinyl not found",
        )

    user = None
    if token:
        user_id = verify_access_token(token)
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()

    friends_listened = []
    if user:
        friend_ids = [
            f.friend_id for f in db.query(Friendship).filter(Friendship.user_id == user.id).all()
        ]
        if friend_ids:
            listened_users = (
                db.query(User)
                .join(PlayRecord, PlayRecord.user_id == User.id)
                .filter(
                    PlayRecord.vinyl_id == vinyl_id,
                    User.id.in_(friend_ids),
                )
                .distinct()
                .all()
            )
            friends_listened = [UserResponse.model_validate(u).model_dump() for u in listened_users]

    result = VinylResponse.model_validate(vinyl).model_dump()
    result["friends_who_listened"] = friends_listened
    return result


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_vinyl(
    title: str = Form(..., min_length=1, max_length=200),
    artist: str = Form(..., min_length=1, max_length=200),
    release_year: Optional[int] = Form(None, ge=1900, le=2100),
    genre: Optional[str] = Form(None, max_length=100),
    rating: Optional[float] = Form(None, ge=1, le=10),
    notes: Optional[str] = Form(None),
    cover: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cover_url = None
    if cover:
        validate_upload_file(cover)

        file_bytes = await cover.read()
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB",
            )

        ext = cover.filename.rsplit(".", 1)[-1].lower()
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        file_path = UPLOADS_DIR / unique_name
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        cover_url = f"/uploads/{unique_name}"

    vinyl = Vinyl(
        title=title,
        artist=artist,
        release_year=release_year,
        genre=genre,
        rating=rating,
        notes=notes,
        cover_url=cover_url,
        owner_id=current_user.id,
    )
    db.add(vinyl)
    db.commit()
    db.refresh(vinyl)

    post_content = f"新添加了一张唱片：《{title}》 - {artist}"
    post = Post(
        user_id=current_user.id,
        vinyl_id=vinyl.id,
        content=post_content,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return {
        "vinyl": VinylResponse.model_validate(vinyl).model_dump(),
        "post": PostResponse.model_validate(post).model_dump(),
    }


@router.put("/{vinyl_id}", response_model=VinylResponse)
async def update_vinyl(
    vinyl_id: int,
    title: Optional[str] = Form(None, min_length=1, max_length=200),
    artist: Optional[str] = Form(None, min_length=1, max_length=200),
    release_year: Optional[int] = Form(None, ge=1900, le=2100),
    genre: Optional[str] = Form(None, max_length=100),
    rating: Optional[float] = Form(None, ge=1, le=10),
    notes: Optional[str] = Form(None),
    cover: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vinyl = db.query(Vinyl).filter(Vinyl.id == vinyl_id).first()
    if vinyl is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vinyl not found",
        )

    verify_vinyl_owner(vinyl, current_user)

    if title is not None:
        vinyl.title = title
    if artist is not None:
        vinyl.artist = artist
    if release_year is not None:
        vinyl.release_year = release_year
    if genre is not None:
        vinyl.genre = genre
    if rating is not None:
        vinyl.rating = rating
    if notes is not None:
        vinyl.notes = notes

    if cover:
        validate_upload_file(cover)

        file_bytes = await cover.read()
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB",
            )

        ext = cover.filename.rsplit(".", 1)[-1].lower()
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        file_path = UPLOADS_DIR / unique_name
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        if vinyl.cover_url and vinyl.cover_url.startswith("/uploads/"):
            old_path = UPLOADS_DIR / vinyl.cover_url[len("/uploads/"):]
            if old_path.exists():
                try:
                    os.remove(old_path)
                except OSError:
                    pass

        vinyl.cover_url = f"/uploads/{unique_name}"

    db.commit()
    db.refresh(vinyl)
    return VinylResponse.model_validate(vinyl)


@router.patch("/{vinyl_id}/rating", response_model=VinylResponse)
def update_rating(
    vinyl_id: int,
    rating: float = Query(..., ge=1, le=10, description="评分 (1-10)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vinyl = db.query(Vinyl).filter(Vinyl.id == vinyl_id).first()
    if vinyl is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vinyl not found",
        )

    verify_vinyl_owner(vinyl, current_user)

    vinyl.rating = rating
    db.commit()
    db.refresh(vinyl)
    return VinylResponse.model_validate(vinyl)


@router.delete("/{vinyl_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vinyl(
    vinyl_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vinyl = db.query(Vinyl).filter(Vinyl.id == vinyl_id).first()
    if vinyl is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vinyl not found",
        )

    verify_vinyl_owner(vinyl, current_user)

    if vinyl.cover_url and vinyl.cover_url.startswith("/uploads/"):
        old_path = UPLOADS_DIR / vinyl.cover_url[len("/uploads/"):]
        if old_path.exists():
            try:
                os.remove(old_path)
            except OSError:
                pass

    db.delete(vinyl)
    db.commit()
    return None
