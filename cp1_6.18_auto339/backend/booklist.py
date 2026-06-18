from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from models import BookList, Book, User, get_db
from auth import get_current_user

router = APIRouter(prefix="/api/booklists", tags=["booklists"])


class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    cover_url: Optional[str] = None
    tags: str
    progress: int
    notes: str
    added_at: datetime

    class Config:
        from_attributes = True


class BookListResponse(BaseModel):
    id: int
    name: str
    description: str
    cover_color: str
    is_public: bool
    user_id: int
    books: List[BookResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BookListWithUserResponse(BookListResponse):
    user: Optional[dict] = None


class CreateBookListRequest(BaseModel):
    name: str = Field(..., max_length=30)
    description: str = Field("", max_length=200)
    cover_color: str = "#4ECDC4"
    is_public: bool = False


class UpdateBookListRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=30)
    description: Optional[str] = Field(None, max_length=200)
    cover_color: Optional[str] = None
    is_public: Optional[bool] = None


class AddBookRequest(BaseModel):
    title: str
    author: str
    cover_url: Optional[str] = None
    tags: Optional[str] = ""
    progress: int = Field(0, ge=0, le=100)
    notes: str = Field("", max_length=500)


class UpdateBookRequest(BaseModel):
    progress: Optional[int] = Field(None, ge=0, le=100)
    notes: Optional[str] = Field(None, max_length=500)
    cover_url: Optional[str] = None


def serialize_booklist(bl: BookList, include_user: bool = False) -> dict:
    data = {
        "id": bl.id,
        "name": bl.name,
        "description": bl.description,
        "cover_color": bl.cover_color,
        "is_public": bl.is_public,
        "user_id": bl.user_id,
        "books": [
            {
                "id": b.id,
                "title": b.title,
                "author": b.author,
                "cover_url": b.cover_url,
                "tags": b.tags,
                "progress": b.progress,
                "notes": b.notes,
                "added_at": b.added_at,
            }
            for b in bl.books
        ],
        "created_at": bl.created_at,
        "updated_at": bl.updated_at,
    }
    if include_user and bl.user:
        data["user"] = {
            "id": bl.user.id,
            "username": bl.user.username,
            "email": bl.user.email,
            "created_at": bl.user.created_at,
        }
    return data


@router.post("", response_model=BookListResponse)
def create_booklist(req: CreateBookListRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bl = BookList(
        name=req.name,
        description=req.description,
        cover_color=req.cover_color,
        is_public=req.is_public,
        user_id=current_user.id,
    )
    db.add(bl)
    db.commit()
    db.refresh(bl)
    return serialize_booklist(bl)


@router.get("", response_model=List[BookListResponse])
def get_my_booklists(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bls = db.query(BookList).filter(BookList.user_id == current_user.id).order_by(BookList.updated_at.desc()).all()
    return [serialize_booklist(bl) for bl in bls]


@router.get("/public", response_model=List[dict])
def get_public_booklists(db: Session = Depends(get_db)):
    bls = db.query(BookList).filter(BookList.is_public == True).order_by(BookList.updated_at.desc()).limit(20).all()
    return [serialize_booklist(bl, include_user=True) for bl in bls]


@router.get("/{booklist_id}", response_model=dict)
def get_booklist(booklist_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bl = db.query(BookList).filter(BookList.id == booklist_id).first()
    if not bl:
        raise HTTPException(status_code=404, detail="书单不存在")
    if not bl.is_public and bl.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权限访问此书单")
    return serialize_booklist(bl, include_user=True)


@router.put("/{booklist_id}", response_model=BookListResponse)
def update_booklist(booklist_id: int, req: UpdateBookListRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bl = db.query(BookList).filter(BookList.id == booklist_id).first()
    if not bl:
        raise HTTPException(status_code=404, detail="书单不存在")
    if bl.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权限修改此书单")

    if req.name is not None:
        bl.name = req.name
    if req.description is not None:
        bl.description = req.description
    if req.cover_color is not None:
        bl.cover_color = req.cover_color
    if req.is_public is not None:
        bl.is_public = req.is_public

    bl.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(bl)
    return serialize_booklist(bl)


@router.post("/{booklist_id}/books", response_model=BookResponse)
def add_book(booklist_id: int, req: AddBookRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bl = db.query(BookList).filter(BookList.id == booklist_id).first()
    if not bl:
        raise HTTPException(status_code=404, detail="书单不存在")
    if bl.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权限操作此书单")

    book = Book(
        title=req.title,
        author=req.author,
        cover_url=req.cover_url,
        tags=req.tags or "",
        progress=req.progress,
        notes=req.notes,
        booklist_id=booklist_id,
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


@router.put("/{booklist_id}/books/{book_id}", response_model=BookResponse)
def update_book(booklist_id: int, book_id: int, req: UpdateBookRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bl = db.query(BookList).filter(BookList.id == booklist_id).first()
    if not bl or bl.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权限操作此书单")
    book = db.query(Book).filter(Book.id == book_id, Book.booklist_id == booklist_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")

    if req.progress is not None:
        book.progress = req.progress
    if req.notes is not None:
        book.notes = req.notes
    if req.cover_url is not None:
        book.cover_url = req.cover_url

    db.commit()
    db.refresh(book)
    return book


@router.delete("/{booklist_id}/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(booklist_id: int, book_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bl = db.query(BookList).filter(BookList.id == booklist_id).first()
    if not bl or bl.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权限操作此书单")
    book = db.query(Book).filter(Book.id == book_id, Book.booklist_id == booklist_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
    db.delete(book)
    db.commit()
    return None


@router.post("/{booklist_id}/clone", response_model=BookListResponse)
def clone_booklist(booklist_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bl = db.query(BookList).filter(BookList.id == booklist_id).first()
    if not bl:
        raise HTTPException(status_code=404, detail="书单不存在")
    if not bl.is_public and bl.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权限克隆此书单")

    new_bl = BookList(
        name=f"{bl.name}（克隆）",
        description=bl.description,
        cover_color=bl.cover_color,
        is_public=False,
        user_id=current_user.id,
    )
    db.add(new_bl)
    db.flush()

    for b in bl.books:
        nb = Book(
            title=b.title,
            author=b.author,
            cover_url=b.cover_url,
            tags=b.tags,
            progress=b.progress,
            notes=b.notes,
            booklist_id=new_bl.id,
        )
        db.add(nb)

    db.commit()
    db.refresh(new_bl)
    return serialize_booklist(new_bl)


@router.get("/books/search/autocomplete")
def autocomplete_books(q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if len(q.strip()) < 1:
        return []
    books = db.query(Book.title, Book.author).filter(
        or_(Book.title.contains(q), Book.author.contains(q))
    ).group_by(Book.title, Book.author).limit(5).all()
    return [{"title": b.title, "author": b.author} for b in books]
