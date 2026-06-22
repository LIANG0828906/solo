import os
import uuid
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc

import models
import schemas
from database import engine, get_db
from audio_analyzer import audio_analyzer

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="声纹心情日记 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/api/users/", response_model=schemas.User, status_code=201)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    db_user = models.User(username=user.username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/api/users/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return db_user


@app.post("/api/diaries/", response_model=schemas.Diary, status_code=201)
async def create_diary(
    user_id: int = Form(...),
    text_content: str = Form(...),
    is_public: bool = Form(False),
    emotion_x: Optional[float] = Form(50.0),
    emotion_y: Optional[float] = Form(50.0),
    emotion_type: Optional[str] = Form("平静"),
    audio: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="用户不存在")

    audio_path = None
    if audio:
        file_ext = os.path.splitext(audio.filename or "audio.wav")[1] or ".wav"
        unique_name = f"{uuid.uuid4().hex}{file_ext}"
        audio_path = os.path.join(UPLOAD_DIR, unique_name)
        with open(audio_path, "wb") as f:
            content = await audio.read()
            f.write(content)

    db_diary = models.Diary(
        user_id=user_id,
        audio_path=audio_path,
        text_content=text_content,
        is_public=is_public,
        emotion_x=emotion_x,
        emotion_y=emotion_y,
        emotion_type=emotion_type,
    )
    db.add(db_diary)
    db.commit()
    db.refresh(db_diary)
    return db_diary


@app.get("/api/diaries/", response_model=List[schemas.Diary])
def get_diaries(
    emotion_type: Optional[str] = Query(None, description="按情绪类型筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(models.Diary).filter(models.Diary.is_public == True)
    if emotion_type:
        query = query.filter(models.Diary.emotion_type == emotion_type)
    diaries = (
        query.order_by(desc(models.Diary.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return diaries


@app.get("/api/diaries/{diary_id}", response_model=schemas.Diary)
def get_diary(diary_id: int, db: Session = Depends(get_db)):
    db_diary = db.query(models.Diary).filter(models.Diary.id == diary_id).first()
    if not db_diary:
        raise HTTPException(status_code=404, detail="日记不存在")
    return db_diary


@app.delete("/api/diaries/{diary_id}", status_code=204)
def delete_diary(diary_id: int, db: Session = Depends(get_db)):
    db_diary = db.query(models.Diary).filter(models.Diary.id == diary_id).first()
    if not db_diary:
        raise HTTPException(status_code=404, detail="日记不存在")

    if db_diary.audio_path and os.path.exists(db_diary.audio_path):
        try:
            os.remove(db_diary.audio_path)
        except OSError:
            pass

    db.delete(db_diary)
    db.commit()
    return None


@app.post("/api/diaries/{diary_id}/comments/", response_model=schemas.Comment, status_code=201)
def add_comment(
    diary_id: int,
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
):
    db_diary = db.query(models.Diary).filter(models.Diary.id == diary_id).first()
    if not db_diary:
        raise HTTPException(status_code=404, detail="日记不存在")

    db_user = db.query(models.User).filter(models.User.id == comment.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="用户不存在")

    db_comment = models.Comment(
        diary_id=diary_id,
        user_id=comment.user_id,
        content=comment.content,
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


@app.get("/api/diaries/{diary_id}/comments/", response_model=List[schemas.Comment])
def get_comments(
    diary_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    db_diary = db.query(models.Diary).filter(models.Diary.id == diary_id).first()
    if not db_diary:
        raise HTTPException(status_code=404, detail="日记不存在")

    comments = (
        db.query(models.Comment)
        .filter(models.Comment.diary_id == diary_id)
        .order_by(desc(models.Comment.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return comments


@app.post("/api/analyze/", response_model=schemas.AudioAnalysisResult)
async def analyze_audio(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    result = audio_analyzer.analyze(audio_bytes)
    return result


@app.get("/")
def root():
    return {"message": "声纹心情日记 API 运行中", "version": "1.0.0"}
