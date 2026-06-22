import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import hashlib
import base64
from datetime import datetime, date
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db, init_db
from backend.models import User, Book, BookShelf, Comment, ReadingChallenge

app = FastAPI(title="韵动书架 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MOCK_BOOKS_DATA = {
    "9787020002207": {
        "title": "红楼梦",
        "authors": ["曹雪芹", "高鹗"],
        "description": "中国古典四大名著之首，清代作家曹雪芹创作的章回体长篇小说。小说以贾、史、王、薛四大家族的兴衰为背景，以富贵公子贾宝玉为视角，描绘了一批举止见识高于须眉之上的闺阁佳人的人生百态。",
        "pageCount": 1606,
        "publishDate": "1996-12-01",
    },
    "9787544270878": {
        "title": "百年孤独",
        "authors": ["加西亚·马尔克斯"],
        "description": "魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事，以及加勒比海沿岸小镇马孔多的百年兴衰，反映了拉丁美洲一个世纪以来风云变幻的历史。",
        "pageCount": 360,
        "publishDate": "2011-06-01",
    },
    "9787532748167": {
        "title": "追风筝的人",
        "authors": ["卡勒德·胡赛尼"],
        "description": "关于友谊、背叛、救赎的动人故事，12岁的阿富汗富家少爷阿米尔与仆人哈桑情同手足。然而，在一场风筝比赛后，发生了一件悲惨的事，阿米尔为自己的懦弱感到自责和痛苦。",
        "pageCount": 362,
        "publishDate": "2006-05-01",
    },
    "9787544253994": {
        "title": "小王子",
        "authors": ["圣埃克苏佩里"],
        "description": "以一位飞行员作为故事叙述者，讲述了小王子从自己星球出发前往地球的过程中，所经历的各种历险。作者以小王子的孩子式的眼光，透视出成人的空虚、盲目，愚妄和死板教条。",
        "pageCount": 97,
        "publishDate": "2003-08-01",
    },
    "9787020024759": {
        "title": "活着",
        "authors": ["余华"],
        "description": "讲述了农村人福贵悲惨的人生遭遇。福贵本是个阔少爷，可他嗜赌如命，终于赌光了家业一贫如洗。他的父亲被他活活气死，母亲则在穷困中患了重病。",
        "pageCount": 191,
        "publishDate": "1993-01-01",
    },
    "9787532754687": {
        "title": "嫌疑人X的献身",
        "authors": ["东野圭吾"],
        "description": "一个数学天才与一位邻居的故事，究竟爱一个人，可以爱到什么地步？究竟什么样的邂逅，可以舍命不悔？逻辑的尽头，不是理性与秩序的理想国，而是我用生命奉献的爱情。",
        "pageCount": 251,
        "publishDate": "2008-09-01",
    },
    "9787544280907": {
        "title": "解忧杂货店",
        "authors": ["东野圭吾"],
        "description": "僻静的街道旁有一家杂货店，只要写下烦恼投进店前门卷帘门的投信口，第二天就会在店后的牛奶箱里得到回答。奇妙的事情随即不断发生。",
        "pageCount": 291,
        "publishDate": "2014-05-01",
    },
    "9787559600790": {
        "title": "三体",
        "authors": ["刘慈欣"],
        "description": "文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划'红岸工程'取得了突破性进展。但在按下发射键的那一刻，历经劫难的叶文洁没有意识到，她彻底改变了人类的命运。",
        "pageCount": 302,
        "publishDate": "2008-01-01",
    },
    "9787530211007": {
        "title": "平凡的世界",
        "authors": ["路遥"],
        "description": "以孙少安和孙少平两兄弟为中心，通过复杂的矛盾纠葛，刻画了当时社会各阶层众多普通人的形象，展示了普通人在大时代历史进程中所走过的艰难曲折的道路。",
        "pageCount": 1600,
        "publishDate": "2009-01-01",
    },
    "9787020110902": {
        "title": "围城",
        "authors": ["钱钟书"],
        "description": "以抗日战争初期为背景，通过主人公方鸿渐的人生经历，从上海到内地再到香港，再到上海，写出了在婚姻、事业、学问等方面的'围城'之困。",
        "pageCount": 359,
        "publishDate": "1991-02-01",
    },
}

MOCK_COVERS = [
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&h=600&fit=crop",
]


def get_cover_for_isbn(isbn: str) -> str:
    idx = abs(hash(isbn)) % len(MOCK_COVERS)
    return MOCK_COVERS[idx]


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_token(user_id: str) -> str:
    raw = f"{user_id}:{datetime.now().isoformat()}"
    return base64.b64encode(raw.encode()).decode()


def get_user_from_token(db: Session, authorization: Optional[str] = None) -> User:
    if not authorization:
        raise HTTPException(status_code=401, detail="未提供认证令牌")
    try:
        raw = base64.b64decode(authorization.replace("Bearer ", "")).decode()
        user_id = raw.split(":")[0]
    except Exception:
        raise HTTPException(status_code=401, detail="无效的认证令牌")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"message": "韵动书架 API 运行中", "docs": "/docs"}


class LoginReq(BaseModel):
    username: str
    password: str


class RegisterReq(BaseModel):
    username: str
    password: str
    email: Optional[str] = None


@app.post("/api/auth/login")
def login(req: LoginReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or user.password_hash != hash_password(req.password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    token = create_token(user.id)
    return {"token": token, "user": user.to_dict()}


@app.post("/api/auth/register")
def register(req: RegisterReq, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    user = User(
        username=req.username,
        email=req.email,
        password_hash=hash_password(req.password),
        avatar_url=f"https://api.dicebear.com/7.x/identicon/svg?seed={req.username}",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token(user.id)
    return {"token": token, "user": user.to_dict()}


@app.get("/api/books")
def get_book_metadata(isbn: Optional[str] = None, db: Session = Depends(get_db), authorization: Optional[str] = Header(None)):
    if isbn:
        data = MOCK_BOOKS_DATA.get(isbn)
        if data is None:
            pseudo_title = f"书籍-{isbn[-6:] if len(isbn) >= 6 else isbn}"
            return {
                "isbn": isbn,
                "title": pseudo_title,
                "authors": ["未知作者"],
                "coverUrl": get_cover_for_isbn(isbn),
                "description": "暂无简介内容，您可以稍后在书籍详情页补充关于这本书的个人阅读感受。",
                "publishDate": date.today().isoformat(),
                "pageCount": 256,
            }
        return {
            "isbn": isbn,
            "title": data["title"],
            "authors": data["authors"],
            "coverUrl": get_cover_for_isbn(isbn),
            "description": data["description"],
            "publishDate": data["publishDate"],
            "pageCount": data["pageCount"],
        }
    if authorization:
        user = get_user_from_token(db, authorization)
        books = db.query(Book).filter(Book.user_id == user.id).order_by(Book.created_at.desc()).all()
        return [b.to_dict() for b in books]
    raise HTTPException(status_code=401, detail="请提供ISBN或登录后查看书架")


class AddBookReq(BaseModel):
    isbn: Optional[str] = None
    title: str
    authors: List[str]
    coverUrl: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = []
    rating: Optional[int] = None
    status: Optional[str] = "wishlist"
    pagesRead: Optional[int] = 0
    totalPages: Optional[int] = 0


@app.post("/api/books")
def add_book(req: AddBookReq, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_user_from_token(db, authorization)
    book = Book(
        user_id=user.id,
        isbn=req.isbn,
        title=req.title,
        authors=json.dumps(req.authors, ensure_ascii=False),
        cover_url=req.coverUrl,
        description=req.description,
        tags=json.dumps(req.tags or [], ensure_ascii=False),
        rating=req.rating,
        status=req.status or "wishlist",
        pages_read=req.pagesRead or 0,
        total_pages=req.totalPages or 0,
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book.to_dict()


@app.put("/api/books/{book_id}")
def update_book(book_id: str, req: AddBookReq, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_user_from_token(db, authorization)
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
    book.title = req.title
    book.authors = json.dumps(req.authors, ensure_ascii=False)
    book.cover_url = req.coverUrl
    book.description = req.description
    book.tags = json.dumps(req.tags or [], ensure_ascii=False)
    book.rating = req.rating
    book.status = req.status or "wishlist"
    book.pages_read = req.pagesRead or 0
    book.total_pages = req.totalPages or 0
    db.commit()
    db.refresh(book)
    return book.to_dict()


@app.delete("/api/books/{book_id}")
def delete_book(book_id: str, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_user_from_token(db, authorization)
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
    db.delete(book)
    db.commit()
    return {"success": True}


class ShelfReq(BaseModel):
    name: str
    description: Optional[str] = None
    theme: Optional[str] = None
    bookIds: List[str] = []
    isPublic: bool = False


@app.get("/api/shelves")
def list_shelves(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_user_from_token(db, authorization)
    shelves = db.query(BookShelf).filter(BookShelf.user_id == user.id).order_by(BookShelf.created_at.desc()).all()
    return [s.to_dict() for s in shelves]


@app.post("/api/shelves")
def create_shelf(req: ShelfReq, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_user_from_token(db, authorization)
    cover_mosaic = []
    for bid in req.bookIds[:4]:
        b = db.query(Book).filter(Book.id == bid, Book.user_id == user.id).first()
        if b and b.cover_url:
            cover_mosaic.append(b.cover_url)
    while len(cover_mosaic) < 4 and len(cover_mosaic) < len(MOCK_COVERS):
        for c in MOCK_COVERS:
            if c not in cover_mosaic:
                cover_mosaic.append(c)
                if len(cover_mosaic) >= 4:
                    break
    shelf = BookShelf(
        user_id=user.id,
        name=req.name,
        description=req.description,
        theme=req.theme,
        book_ids=json.dumps(req.bookIds, ensure_ascii=False),
        cover_mosaic=json.dumps(cover_mosaic[:4], ensure_ascii=False),
        is_public=req.isPublic,
    )
    db.add(shelf)
    db.commit()
    db.refresh(shelf)
    return shelf.to_dict()


@app.get("/api/shelves/{shelf_id}")
def get_shelf(shelf_id: str, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_user_from_token(db, authorization)
    shelf = db.query(BookShelf).filter(BookShelf.id == shelf_id, BookShelf.user_id == user.id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="书单不存在")
    data = shelf.to_dict(include_comments=True, db=db)
    books_in_shelf = []
    for bid in data["bookIds"]:
        b = db.query(Book).filter(Book.id == bid, Book.user_id == user.id).first()
        if b:
            books_in_shelf.append(b.to_dict())
    data["books"] = books_in_shelf
    return data


@app.put("/api/shelves/{shelf_id}")
def update_shelf(shelf_id: str, req: ShelfReq, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_user_from_token(db, authorization)
    shelf = db.query(BookShelf).filter(BookShelf.id == shelf_id, BookShelf.user_id == user.id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="书单不存在")
    cover_mosaic = []
    for bid in req.bookIds[:4]:
        b = db.query(Book).filter(Book.id == bid, Book.user_id == user.id).first()
        if b and b.cover_url:
            cover_mosaic.append(b.cover_url)
    shelf.name = req.name
    shelf.description = req.description
    shelf.theme = req.theme
    shelf.book_ids = json.dumps(req.bookIds, ensure_ascii=False)
    if cover_mosaic:
        shelf.cover_mosaic = json.dumps(cover_mosaic[:4], ensure_ascii=False)
    shelf.is_public = req.isPublic
    db.commit()
    db.refresh(shelf)
    return shelf.to_dict()


@app.delete("/api/shelves/{shelf_id}")
def delete_shelf(shelf_id: str, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_user_from_token(db, authorization)
    shelf = db.query(BookShelf).filter(BookShelf.id == shelf_id, BookShelf.user_id == user.id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="书单不存在")
    db.delete(shelf)
    db.commit()
    return {"success": True}


@app.post("/api/shelves/{shelf_id}/like")
def like_shelf(shelf_id: str, db: Session = Depends(get_db)):
    shelf = db.query(BookShelf).filter(BookShelf.id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="书单不存在")
    shelf.likes_count += 1
    db.commit()
    db.refresh(shelf)
    return {"likes": shelf.likes_count}


class CommentReq(BaseModel):
    username: str
    content: str


@app.post("/api/shelves/{shelf_id}/comment")
def add_comment(shelf_id: str, req: CommentReq, db: Session = Depends(get_db)):
    shelf = db.query(BookShelf).filter(BookShelf.id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="书单不存在")
    comment = Comment(shelf_id=shelf_id, guest_name=req.username, content=req.content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment.to_dict()


@app.get("/api/shelves/shared/{encoded_id}")
def get_shared_shelf(encoded_id: str, db: Session = Depends(get_db)):
    try:
        shelf_id = base64.urlsafe_b64decode(encoded_id.encode()).decode()
    except Exception:
        raise HTTPException(status_code=400, detail="无效的分享链接")
    shelf = db.query(BookShelf).filter(BookShelf.id == shelf_id, BookShelf.is_public == True).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="书单不存在或未公开")
    data = shelf.to_dict(include_comments=True, db=db)
    books_in_shelf = []
    user = db.query(User).filter(User.id == shelf.user_id).first()
    for bid in data["bookIds"]:
        b = db.query(Book).filter(Book.id == bid).first()
        if b:
            books_in_shelf.append(b.to_dict())
    data["books"] = books_in_shelf
    data["owner"] = user.username if user else "未知用户"
    return data


@app.get("/api/stats/reading")
def get_reading_stats(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    user = get_user_from_token(db, authorization)
    books = db.query(Book).filter(Book.user_id == user.id).all()
    total_finished = sum(1 for b in books if b.status == "finished")
    monthly_pages = sum(b.pages_read for b in books)
    rated_books = [b for b in books if b.rating]
    avg_rating = round(sum(b.rating for b in rated_books) / len(rated_books), 1) if rated_books else 0
    return {
        "totalBooksRead": total_finished,
        "monthlyPages": monthly_pages,
        "averageRating": avg_rating,
        "currentStreak": 7,
    }
