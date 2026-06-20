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
                "title": "星空下的麦田",
                "creator": "Vincent van Gogh",
                "description": "这幅画描绘了法国南部普罗旺斯地区夜晚星空下的金色麦田，充满了梵高标志性的漩涡状笔触和强烈的情感表达。深蓝色的夜空中闪烁着明亮的星星，与金黄色的麦田形成鲜明对比。",
                "image_url": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80",
                "start_price": 35000.0,
                "min_increment": 500.0,
                "hours": 2,
            },
            {
                "title": "睡莲池畔",
                "creator": "Claude Monet",
                "description": "莫奈晚年的代表作之一，捕捉了吉维尼花园中睡莲池的光影变化。水面倒映着天空和垂柳，粉色、紫色和绿色的笔触交织在一起，展现了印象派对光线的极致追求。",
                "image_url": "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80",
                "start_price": 50000.0,
                "min_increment": 1000.0,
                "hours": 12,
            },
            {
                "title": "格尔尼卡的记忆",
                "creator": "Pablo Picasso",
                "description": "受毕加索立体主义风格启发的作品，用碎裂的几何形状和强烈的黑白对比表达战争的痛苦。扭曲的人物形象和公牛象征着苦难与抗争，是现代艺术中最具政治意义的作品之一。",
                "image_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80",
                "start_price": 45000.0,
                "min_increment": 800.0,
                "hours": 24,
            },
            {
                "title": "日出印象",
                "creator": "Claude Monet",
                "description": "印象派运动的开山之作，描绘了勒阿弗尔港口的日出景象。橙色的太阳在薄雾中若隐若现，水面上的倒影用短促而破碎的笔触表现，彻底改变了西方绘画的方向。",
                "image_url": "https://images.unsplash.com/photo-1549289524-06cf8837ace5?w=800&q=80",
                "start_price": 5000.0,
                "min_increment": 100.0,
                "hours": 48,
            },
            {
                "title": "向日葵的生命",
                "creator": "Vincent van Gogh",
                "description": "梵高最著名的系列作品之一，用炽热的黄色调描绘瓶中的向日葵。厚重的颜料层和奔放的笔触展现了花朵旺盛的生命力，同时也透露出画家内心的孤独与渴望。",
                "image_url": "https://images.unsplash.com/photo-1578926288207-a90a5366759d?w=800&q=80",
                "start_price": 28000.0,
                "min_increment": 500.0,
                "hours": 8,
            },
            {
                "title": "亚维农少女",
                "creator": "Pablo Picasso",
                "description": "立体主义的里程碑作品，彻底打破了传统透视法。五个女性形象以碎片化的几何形式呈现，非洲面具的影响清晰可见，标志着现代艺术进入了全新的维度。",
                "image_url": "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&q=80",
                "start_price": 42000.0,
                "min_increment": 700.0,
                "hours": 36,
            },
        ]

        artworks = []
        for ad in artworks_data:
            end_time = datetime.utcnow() + timedelta(hours=ad["hours"])
            artwork = Artwork(
                title=ad["title"],
                creator=ad["creator"],
                description=ad["description"],
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
