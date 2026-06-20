from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import hashlib
import jwt
from datetime import datetime, timedelta

from database import SessionLocal
from models import User, Goal

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = "health-dashboard-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: EmailStr


@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="用户名已存在")

    existing_email = db.query(User).filter(User.email == request.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="邮箱已注册")

    user = User(
        username=request.username,
        password_hash=hash_password(request.password),
        email=request.email
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    goal = Goal(user_id=user.id)
    db.add(goal)
    db.commit()

    token = create_access_token({"user_id": user.id, "username": user.username})

    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(status_code=400, detail="用户名或密码错误")

    if user.password_hash != hash_password(request.password):
        raise HTTPException(status_code=400, detail="用户名或密码错误")

    token = create_access_token({"user_id": user.id, "username": user.username})

    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }
