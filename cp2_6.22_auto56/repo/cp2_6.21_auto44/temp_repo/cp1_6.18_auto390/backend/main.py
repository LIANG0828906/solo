from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import init_db, SessionLocal
from models import User, ClothingItem, Outfit

init_db()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class UserCreate(BaseModel):
    username: str
    style_preference: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None


class UserResponse(BaseModel):
    id: str
    username: str
    style_preference: Optional[str]
    height: Optional[float]
    weight: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class ClothingItemCreate(BaseModel):
    user_id: str
    type: str
    name: str
    season: Optional[str] = None
    color: Optional[str] = None
    is_virtual: bool = False


class ClothingItemUpdate(BaseModel):
    type: Optional[str] = None
    name: Optional[str] = None
    season: Optional[str] = None
    color: Optional[str] = None
    is_virtual: Optional[bool] = None


class ClothingItemResponse(BaseModel):
    id: str
    user_id: str
    type: str
    name: str
    season: Optional[str]
    color: Optional[str]
    is_virtual: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OutfitCreate(BaseModel):
    user_id: str
    top_id: Optional[str] = None
    bottom_id: Optional[str] = None
    shoes_id: Optional[str] = None
    accessory_id: Optional[str] = None
    reason: Optional[str] = None


class OutfitResponse(BaseModel):
    id: str
    user_id: str
    top_id: Optional[str]
    bottom_id: Optional[str]
    shoes_id: Optional[str]
    accessory_id: Optional[str]
    reason: Optional[str]
    is_favorite: bool
    created_at: datetime

    class Config:
        from_attributes = True


@app.post("/api/users/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    db_user = User(
        username=user.username,
        style_preference=user.style_preference,
        height=user.height,
        weight=user.weight
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/api/users/login", response_model=UserResponse)
def login(username: str, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.get("/api/users/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.get("/api/wardrobe/{user_id}", response_model=List[ClothingItemResponse])
def get_wardrobe(user_id: str, db: Session = Depends(get_db)):
    items = db.query(ClothingItem).filter(ClothingItem.user_id == user_id).all()
    return items


@app.post("/api/wardrobe", response_model=ClothingItemResponse)
def add_clothing_item(item: ClothingItemCreate, db: Session = Depends(get_db)):
    db_item = ClothingItem(
        user_id=item.user_id,
        type=item.type,
        name=item.name,
        season=item.season,
        color=item.color,
        is_virtual=item.is_virtual
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@app.put("/api/wardrobe/{item_id}", response_model=ClothingItemResponse)
def update_clothing_item(item_id: str, item: ClothingItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    if item.type is not None:
        db_item.type = item.type
    if item.name is not None:
        db_item.name = item.name
    if item.season is not None:
        db_item.season = item.season
    if item.color is not None:
        db_item.color = item.color
    if item.is_virtual is not None:
        db_item.is_virtual = item.is_virtual
    db.commit()
    db.refresh(db_item)
    return db_item


@app.delete("/api/wardrobe/{item_id}")
def delete_clothing_item(item_id: str, db: Session = Depends(get_db)):
    db_item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Clothing item deleted successfully"}


@app.get("/api/outfits/{user_id}", response_model=List[OutfitResponse])
def get_outfits(user_id: str, db: Session = Depends(get_db)):
    outfits = db.query(Outfit).filter(Outfit.user_id == user_id).order_by(Outfit.created_at.desc()).all()
    return outfits


@app.post("/api/outfits", response_model=OutfitResponse)
def save_outfit(outfit: OutfitCreate, db: Session = Depends(get_db)):
    db_outfit = Outfit(
        user_id=outfit.user_id,
        top_id=outfit.top_id,
        bottom_id=outfit.bottom_id,
        shoes_id=outfit.shoes_id,
        accessory_id=outfit.accessory_id,
        reason=outfit.reason
    )
    db.add(db_outfit)
    db.commit()
    db.refresh(db_outfit)
    return db_outfit


@app.put("/api/outfits/{outfit_id}/favorite", response_model=OutfitResponse)
def toggle_favorite(outfit_id: str, db: Session = Depends(get_db)):
    db_outfit = db.query(Outfit).filter(Outfit.id == outfit_id).first()
    if not db_outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")
    db_outfit.is_favorite = not db_outfit.is_favorite
    db.commit()
    db.refresh(db_outfit)
    return db_outfit
