import random
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models import SessionLocal, engine, Base, User, Artwork, Bid

Base.metadata.create_all(bind=engine)

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


class ArtworkResponse(BaseModel):
    id: int
    title: str
    creator: str
    description: str
    category: str
    image_url: str
    start_price: float
    current_price: float
    min_increment: float
    highest_bidder: Optional[str]
    end_time: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class BidResponse(BaseModel):
    id: int
    artwork_id: int
    user_id: int
    username: str
    avatar: str
    amount: float
    created_at: datetime

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    username: str
    avatar: str
    wallet: float

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str


class BidRequest(BaseModel):
    artwork_id: int
    user_id: int
    amount: float


class PollResponse(BaseModel):
    artwork: ArtworkResponse
    bids: List[BidResponse]


@app.get("/api/artworks", response_model=List[ArtworkResponse])
def get_artworks(db: Session = Depends(get_db)):
    artworks = db.query(Artwork).order_by(Artwork.created_at.desc()).all()
    return artworks


@app.get("/api/artworks/{artwork_id}", response_model=ArtworkResponse)
def get_artwork(artwork_id: int, db: Session = Depends(get_db)):
    artwork = db.query(Artwork).filter(Artwork.id == artwork_id).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    return artwork


@app.get("/api/artworks/{artwork_id}/bids", response_model=List[BidResponse])
def get_artwork_bids(artwork_id: int, db: Session = Depends(get_db)):
    artwork = db.query(Artwork).filter(Artwork.id == artwork_id).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    bids = db.query(Bid).filter(Bid.artwork_id == artwork_id).order_by(Bid.created_at.desc()).all()
    return bids


@app.post("/api/auth/login", response_model=UserResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    username = request.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        seed = abs(hash(username)) % (10**8)
        avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed}"
        user = User(username=username, avatar=avatar, wallet=50000.0)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@app.post("/api/bids", response_model=BidResponse)
def place_bid(request: BidRequest, db: Session = Depends(get_db)):
    artwork = db.query(Artwork).filter(Artwork.id == request.artwork_id).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")

    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    min_required = artwork.current_price + artwork.min_increment
    if request.amount < min_required:
        raise HTTPException(
            status_code=400,
            detail=f"Bid amount must be at least {min_required}"
        )

    if request.amount > user.wallet:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    if datetime.utcnow() > artwork.end_time:
        raise HTTPException(status_code=400, detail="Auction has ended")

    bid = Bid(
        artwork_id=artwork.id,
        user_id=user.id,
        username=user.username,
        avatar=user.avatar,
        amount=request.amount,
        created_at=datetime.utcnow()
    )
    db.add(bid)

    artwork.current_price = request.amount
    artwork.highest_bidder = user.username

    user.wallet -= request.amount

    db.commit()
    db.refresh(bid)
    return bid


@app.get("/api/artworks/{artwork_id}/poll", response_model=PollResponse)
def poll_artwork(artwork_id: int, db: Session = Depends(get_db)):
    artwork = db.query(Artwork).filter(Artwork.id == artwork_id).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    bids = db.query(Bid).filter(Bid.artwork_id == artwork_id).order_by(Bid.created_at.desc()).all()
    return PollResponse(artwork=artwork, bids=bids)


def init_seed_data():
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return

        users_data = [
            {"username": "user001", "wallet": 100000.0},
            {"username": "user002", "wallet": 80000.0},
            {"username": "user003", "wallet": 150000.0},
        ]

        users = []
        for idx, ud in enumerate(users_data):
            avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed=user00{idx+1}"
            user = User(username=ud["username"], avatar=avatar, wallet=ud["wallet"])
            db.add(user)
            users.append(user)
        db.flush()

        artworks_data = [
            {
                "title": "星夜麦田",
                "creator": "Vincent van Gogh",
                "category": "绘画",
                "description": "后印象派大师梵高的经典风格作品，漩涡状的星空与金黄色的麦田交相辉映，强烈的笔触传达出内心深处的情感波澜。深邃的蓝色夜空与明亮的星月形成震撼对比。",
                "image_url": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80",
                "start_price": 28000.0,
                "min_increment": 500.0,
                "minutes": 90,
            },
            {
                "title": "睡莲晨光",
                "creator": "Claude Monet",
                "category": "绘画",
                "description": "印象派宗师莫奈风格的睡莲池作品，捕捉了清晨阳光下睡莲池的微妙光影变化。水面倒映着天空的色彩，粉色、紫色与绿色的笔触轻盈交织，展现印象派对光线的极致追求。",
                "image_url": "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80",
                "start_price": 45000.0,
                "min_increment": 1000.0,
                "minutes": 45,
            },
            {
                "title": "青铜思想者",
                "creator": "Auguste Rodin",
                "category": "雕塑",
                "description": "受罗丹风格启发的青铜雕塑作品，展现了沉思中的人体姿态。古铜色的表面经过精细打磨，肌肉线条和面部表情栩栩如生，传递出深刻的哲思与力量感。",
                "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
                "start_price": 15000.0,
                "min_increment": 300.0,
                "minutes": 60,
            },
            {
                "title": "城市光影",
                "creator": "Ansel Adams",
                "category": "摄影",
                "description": "黑白摄影大师风格的城市风光作品，通过精确的光影控制展现建筑的几何美感。高对比度的黑白影调赋予画面永恒的艺术质感，每一处细节都充满叙事力量。",
                "image_url": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
                "start_price": 3000.0,
                "min_increment": 100.0,
                "hours": 12,
            },
            {
                "title": "赛博朋克之梦",
                "creator": "Beeple",
                "category": "数字艺术",
                "description": "NFT风格的数字艺术作品，融合赛博朋克美学与超现实想象。霓虹色彩与未来主义建筑构建出迷幻的虚拟世界，代表着数字时代艺术的全新可能性。",
                "image_url": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
                "start_price": 8000.0,
                "min_increment": 200.0,
                "hours": 24,
            },
            {
                "title": "限量蚀刻版画",
                "creator": "Albrecht Dürer",
                "category": "版画",
                "description": "文艺复兴风格的限量蚀刻版画，采用传统铜版蚀刻技法精心制作。细腻的线条与丰富的层次展现了版画艺术的独特魅力，每件作品都有独立编号。",
                "image_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80",
                "start_price": 1000.0,
                "min_increment": 50.0,
                "hours": 48,
            },
        ]

        artworks = []
        for ad in artworks_data:
            if "minutes" in ad:
                end_time = datetime.utcnow() + timedelta(minutes=ad["minutes"])
            else:
                end_time = datetime.utcnow() + timedelta(hours=ad["hours"])
            artwork = Artwork(
                title=ad["title"],
                creator=ad["creator"],
                description=ad["description"],
                category=ad["category"],
                image_url=ad["image_url"],
                start_price=ad["start_price"],
                current_price=ad["start_price"],
                min_increment=ad["min_increment"],
                highest_bidder=None,
                end_time=end_time,
                created_at=datetime.utcnow(),
            )
            db.add(artwork)
            artworks.append(artwork)
        db.flush()

        for artwork in artworks:
            num_bids = random.randint(3, 5)
            current_amount = artwork.start_price
            for i in range(num_bids):
                user = random.choice(users)
                increments = random.randint(1, 5)
                bid_amount = current_amount + (artwork.min_increment * increments)
                if bid_amount > user.wallet:
                    continue

                bid_created = artwork.created_at + timedelta(minutes=random.randint(5, 120) * (i + 1))

                bid = Bid(
                    artwork_id=artwork.id,
                    user_id=user.id,
                    username=user.username,
                    avatar=user.avatar,
                    amount=bid_amount,
                    created_at=bid_created,
                )
                db.add(bid)
                current_amount = bid_amount

            artwork.current_price = current_amount
            highest_bid = db.query(Bid).filter(Bid.artwork_id == artwork.id).order_by(Bid.created_at.desc()).first()
            if highest_bid:
                artwork.highest_bidder = highest_bid.username

        db.commit()
    finally:
        db.close()


init_seed_data()
