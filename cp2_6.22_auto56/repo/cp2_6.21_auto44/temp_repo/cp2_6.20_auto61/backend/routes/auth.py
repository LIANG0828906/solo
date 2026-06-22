from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
import hashlib
import secrets

from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, UserResponse, TokenResponse

router = APIRouter()

tokens = {}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def init_mock_users(db: Session):
    existing = db.query(User).count()
    if existing > 0:
        return

    mock_users = [
        User(
            username="admin",
            email="admin@example.com",
            password=hash_password("admin123"),
            is_expert=True
        ),
        User(
            username="expert_zhang",
            email="zhang@museum.com",
            password=hash_password("expert123"),
            is_expert=True
        ),
        User(
            username="expert_li",
            email="li@museum.com",
            password=hash_password("expert456"),
            is_expert=True
        ),
        User(
            username="student_wang",
            email="wang@university.edu",
            password=hash_password("student123"),
            is_expert=False
        ),
        User(
            username="volunteer_chen",
            email="chen@volunteer.org",
            password=hash_password("volunteer123"),
            is_expert=False
        )
    ]
    db.add_all(mock_users)
    db.commit()


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未提供认证令牌")

    token = authorization.replace("Bearer ", "")
    if token not in tokens:
        raise HTTPException(status_code=401, detail="无效的认证令牌")

    user_id = tokens[token]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user


@router.on_event("startup")
def on_startup():
    db = next(get_db())
    init_mock_users(db)


@router.post("/auth/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="用户名或邮箱已存在")

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password=hash_password(user_data.password),
        is_expert=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/auth/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    if user.password != hash_password(login_data.password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = secrets.token_hex(32)
    tokens[token] = user.id

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )


@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/auth/users", response_model=List[UserResponse])
def get_users(
    is_expert: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User)
    if is_expert is not None:
        query = query.filter(User.is_expert == is_expert)
    users = query.all()
    return users
