from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class User(BaseModel):
    id: str
    username: str

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user: Optional[User] = None
    message: Optional[str] = None

users_db = {}

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire.timestamp()})
    return secrets.token_urlsafe(32)

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = users_db.get(request.username)
    
    if not user:
        hashed_pw = hash_password(request.password)
        user = {
            "id": secrets.token_urlsafe(8),
            "username": request.username,
            "hashed_password": hashed_pw
        }
        users_db[request.username] = user
    
    if user["hashed_password"] != hash_password(request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(
        data={"sub": user["username"]},
        expires_delta=timedelta(days=7)
    )
    
    return {
        "success": True,
        "token": access_token,
        "user": {
            "id": user["id"],
            "username": user["username"]
        }
    }

@router.get("/me")
async def read_users_me(token: str = Depends(oauth2_scheme)):
    return {"username": "demo_user", "id": "demo_123"}
