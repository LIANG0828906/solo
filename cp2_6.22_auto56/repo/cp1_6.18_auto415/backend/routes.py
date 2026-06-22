from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import os
import shutil
from passlib.context import CryptContext
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr

from models import get_db, User, Work, TextSegment, ShareLink
from sentiment import analyze_sentiment

SECRET_KEY = "ciyingliusheng-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/api", tags=["api"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "audio"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "images"), exist_ok=True)

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class TextSegmentCreate(BaseModel):
    text: str
    start_time: float
    end_time: float
    order_index: int

class WorkCreate(BaseModel):
    title: str

class WorkUpdate(BaseModel):
    title: Optional[str] = None
    duration: Optional[int] = None
    text_segments: Optional[List[TextSegmentCreate]] = None

class WorkResponse(BaseModel):
    id: str
    title: str
    duration: int
    audio_path: Optional[str]
    image_path: Optional[str]
    created_at: datetime
    updated_at: datetime
    text_segments: List[dict] = []

    class Config:
        from_attributes = True

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=1440)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(lambda x: x), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/auth/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    db_user = User(
        id=user_id,
        email=user.email,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/works", response_model=List[WorkResponse])
def get_works(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    works = db.query(Work).filter(Work.user_id == current_user.id).order_by(Work.created_at.desc()).all()
    result = []
    for work in works:
        work_dict = {
            "id": work.id,
            "title": work.title,
            "duration": work.duration,
            "audio_path": work.audio_path,
            "image_path": work.image_path,
            "created_at": work.created_at,
            "updated_at": work.updated_at,
            "text_segments": []
        }
        result.append(work_dict)
    return result

@router.post("/works", response_model=WorkResponse)
def create_work(work: WorkCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work_id = str(uuid.uuid4())
    db_work = Work(
        id=work_id,
        user_id=current_user.id,
        title=work.title
    )
    db.add(db_work)
    db.commit()
    db.refresh(db_work)
    return {
        "id": db_work.id,
        "title": db_work.title,
        "duration": db_work.duration,
        "audio_path": db_work.audio_path,
        "image_path": db_work.image_path,
        "created_at": db_work.created_at,
        "updated_at": db_work.updated_at,
        "text_segments": []
    }

@router.get("/works/{work_id}", response_model=WorkResponse)
def get_work(work_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    segments = []
    for seg in work.text_segments:
        segments.append({
            "id": seg.id,
            "text": seg.text,
            "start_time": seg.start_time,
            "end_time": seg.end_time,
            "emotion": seg.emotion,
            "confidence": seg.confidence,
            "order_index": seg.order_index
        })
    
    return {
        "id": work.id,
        "title": work.title,
        "duration": work.duration,
        "audio_path": work.audio_path,
        "image_path": work.image_path,
        "created_at": work.created_at,
        "updated_at": work.updated_at,
        "text_segments": segments
    }

@router.put("/works/{work_id}", response_model=WorkResponse)
def update_work(work_id: str, work_update: WorkUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    if work_update.title is not None:
        work.title = work_update.title
    if work_update.duration is not None:
        work.duration = work_update.duration
    
    if work_update.text_segments is not None:
        db.query(TextSegment).filter(TextSegment.work_id == work_id).delete()
        for seg_data in work_update.text_segments:
            segment_id = str(uuid.uuid4())
            sentiment = analyze_sentiment(seg_data.text)
            segment = TextSegment(
                id=segment_id,
                work_id=work_id,
                text=seg_data.text,
                start_time=seg_data.start_time,
                end_time=seg_data.end_time,
                emotion=sentiment['emotion'],
                confidence=sentiment['confidence'],
                order_index=seg_data.order_index
            )
            db.add(segment)
    
    work.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(work)
    
    segments = []
    for seg in work.text_segments:
        segments.append({
            "id": seg.id,
            "text": seg.text,
            "start_time": seg.start_time,
            "end_time": seg.end_time,
            "emotion": seg.emotion,
            "confidence": seg.confidence,
            "order_index": seg.order_index
        })
    
    return {
        "id": work.id,
        "title": work.title,
        "duration": work.duration,
        "audio_path": work.audio_path,
        "image_path": work.image_path,
        "created_at": work.created_at,
        "updated_at": work.updated_at,
        "text_segments": segments
    }

@router.delete("/works/{work_id}")
def delete_work(work_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    if work.audio_path and os.path.exists(work.audio_path):
        os.remove(work.audio_path)
    if work.image_path and os.path.exists(work.image_path):
        os.remove(work.image_path)
    
    db.delete(work)
    db.commit()
    return {"message": "Work deleted successfully"}

@router.post("/works/{work_id}/audio")
async def upload_audio(work_id: str, file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid audio file")
    
    ext = os.path.splitext(file.filename)[1] or ".mp3"
    file_path = os.path.join(UPLOAD_DIR, "audio", f"{work_id}{ext}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    work.audio_path = file_path
    work.updated_at = datetime.utcnow()
    db.commit()
    
    return {"audio_path": file_path, "audio_url": f"/uploads/audio/{work_id}{ext}"}

@router.post("/works/{work_id}/image")
async def upload_image(work_id: str, file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    if not file.content_type or file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(status_code=400, detail="Only JPG/PNG images are allowed")
    
    file_size = 0
    content = await file.read()
    file_size = len(content)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size must be less than 5MB")
    
    ext = os.path.splitext(file.filename)[1] or ".png"
    file_path = os.path.join(UPLOAD_DIR, "images", f"{work_id}{ext}")
    
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    work.image_path = file_path
    work.updated_at = datetime.utcnow()
    db.commit()
    
    return {"image_path": file_path, "image_url": f"/uploads/images/{work_id}{ext}"}

@router.post("/analyze/sentiment")
def analyze_text_sentiment(text: str = Form(...)):
    result = analyze_sentiment(text)
    return result

@router.get("/share/{work_id}")
def get_share_link(work_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    share_link = db.query(ShareLink).filter(ShareLink.work_id == work_id).first()
    if not share_link:
        share_token = str(uuid.uuid4()).replace("-", "")
        share_link = ShareLink(
            id=str(uuid.uuid4()),
            work_id=work_id,
            share_token=share_token,
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        db.add(share_link)
        db.commit()
        db.refresh(share_link)
    
    return {
        "share_id": share_link.share_token,
        "share_url": f"/share/{share_link.share_token}",
        "view_count": share_link.view_count,
        "expires_at": share_link.expires_at
    }

@router.get("/share/public/{share_token}")
def get_shared_work(share_token: str, db: Session = Depends(get_db)):
    share_link = db.query(ShareLink).filter(ShareLink.share_token == share_token).first()
    if not share_link:
        raise HTTPException(status_code=404, detail="Share link not found")
    
    if share_link.expires_at and share_link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Share link has expired")
    
    share_link.view_count += 1
    db.commit()
    
    work = share_link.work
    segments = []
    for seg in work.text_segments:
        segments.append({
            "id": seg.id,
            "text": seg.text,
            "start_time": seg.start_time,
            "end_time": seg.end_time,
            "emotion": seg.emotion,
            "confidence": seg.confidence,
            "order_index": seg.order_index
        })
    
    return {
        "id": work.id,
        "title": work.title,
        "duration": work.duration,
        "audio_path": work.audio_path,
        "image_path": work.image_path,
        "audio_url": f"/uploads/audio/{work.id}{os.path.splitext(work.audio_path)[1]}" if work.audio_path else None,
        "image_url": f"/uploads/images/{work.id}{os.path.splitext(work.image_path)[1]}" if work.image_path else None,
        "text_segments": segments,
        "view_count": share_link.view_count
    }

@router.get("/uploads/{folder}/{filename}")
def get_uploaded_file(folder: str, filename: str):
    file_path = os.path.join(UPLOAD_DIR, folder, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
