from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from datetime import datetime, timedelta
from database import get_db, verify_password
from models.admin import LoginRequest, TokenResponse
import aiosqlite

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = "gallery-secret-key-2024"
ALGORITHM = "HS256"


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT * FROM admins WHERE username = ?", ("admin",))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(request.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    expire = datetime.utcnow() + timedelta(hours=24)
    token = jwt.encode({"sub": row["username"], "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
    return TokenResponse(token=token)
