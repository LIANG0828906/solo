from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Bid(BaseModel):
    id: int
    userId: int
    userName: str
    amount: float
    time: datetime


class Item(BaseModel):
    id: int
    auctionId: int
    name: str
    description: str
    startPrice: float
    currentPrice: float
    imageUrl: str
    startTime: datetime
    endTime: datetime
    bids: List[Bid]
    isFavorite: bool = False


class Auction(BaseModel):
    id: int
    name: str
    description: str
    imageUrl: str
    startTime: datetime
    endTime: datetime
    itemCount: int
    items: Optional[List[Item]] = None


class UserBid(BaseModel):
    id: int
    userId: int
    itemId: int
    itemName: str
    itemImageUrl: str
    amount: float
    time: datetime
    isWinning: bool


class FavoriteItem(BaseModel):
    id: int
    itemId: int
    itemName: str
    itemImageUrl: str
    currentPrice: float
    endTime: datetime


class BidRequest(BaseModel):
    userId: int
    amount: float


now = datetime.now()

mock_bids_1 = [
    Bid(id=1, userId=2, userName="收藏家王", amount=5200.0, time=now - timedelta(hours=2)),
    Bid(id=2, userId=3, userName="艺术品爱好者", amount=5500.0, time=now - timedelta(hours=1, minutes=30)),
    Bid(id=3, userId=4, userName="古玩家小李", amount=5800.0, time=now - timedelta(hours=1)),
    Bid(id=4, userId=2, userName="收藏家王", amount=6200.0, time=now - timedelta(minutes=45)),
]

mock_bids_2 = [
    Bid(id=5, userId=5, userName="书画藏家陈", amount=8000.0, time=now - timedelta(hours=3)),
    Bid(id=6, userId=3, userName="艺术品爱好者", amount=8500.0, time=now - timedelta(hours=2)),
    Bid(id=7, userId=5, userName="书画藏家陈", amount=9200.0, time=now - timedelta(hours=1, minutes=20)),
]

mock_bids_3 = [
    Bid(id=8, userId=1, userName="用户张三", amount=1200.0, time=now - timedelta(hours=5)),
    Bid(id=9, userId=6, userName="珠宝达人", amount=1500.0, time=now - timedelta(hours=4)),
    Bid(id=10, userId=1, userName="用户张三", amount=1800.0, time=now - timedelta(hours=3)),
    Bid(id=11, userId=6, userName="珠宝达人", amount=2200.0, time=now - timedelta(hours=2)),
    Bid(id=12, userId=1, userName="用户张三", amount=2800.0, time=now - timedelta(hours=1)),
]

mock_bids_4 = [
    Bid(id=13, userId=7, userName="钟表收藏", amount=15000.0, time=now - timedelta(hours=6)),
    Bid(id=14, userId=8, userName="表友老周", amount=18000.0, time=now - timedelta(hours=4)),
    Bid(id=15, userId=7, userName="钟表收藏", amount=22000.0, time=now - timedelta(hours=2)),
]

mock_bids_5 = [
    Bid(id=16, userId=9, userName="瓷韵轩", amount=3500.0, time=now - timedelta(hours=2)),
    Bid(id=17, userId=4, userName="古玩家小李", amount=4200.0, time=now - timedelta(hours=1, minutes=30)),
    Bid(id=18, userId=9, userName="瓷韵轩", amount=5000.0, time=now - timedelta(minutes=50)),
]

mock_bids_6 = [
    Bid(id=19, userId=10, userName="老酒坊", amount=2000.0, time=now - timedelta(hours=3)),
    Bid(id=20, userId=11, userName="品酒家", amount=2500.0, time=now - timedelta(hours=2)),
    Bid(id=21, userId=10, userName="老酒坊", amount=3200.0, time=now - timedelta(hours=1)),
    Bid(id=22, userId=11, userName="品酒家", amount=3800.0, time=now - timedelta(minutes=30)),
]

mock_bids_7 = [
    Bid(id=23, userId=3, userName="艺术品爱好者", amount=4500.0, time=now - timedelta(hours=4)),
    Bid(id=24, userId=5, userName="书画藏家陈", amount=5200.0, time=now - timedelta(hours=3)),
    Bid(id=25, userId=3, userName="艺术品爱好者", amount=6000.0, time=now - timedelta(hours=2)),
]

mock_items_1 = [
    Item(
        id=1,
        auctionId=1,
        name="清代青花瓷瓶",
        description="清代乾隆年间官窑青花瓷瓶，保存完好，釉色温润，是收藏佳品。",
        startPrice=5000.0,
        currentPrice=6200.0,
        imageUrl="https://picsum.photos/seed/porcelain1/400/300",
        startTime=now - timedelta(days=1),
        endTime=now + timedelta(days=2),
        bids=mock_bids_1,
    ),
    Item(
        id=2,
        auctionId=1,
        name="明代书法真迹",
        description="明代著名书法家董其昌真迹，笔墨精妙，传承有序。",
        startPrice=8000.0,
        currentPrice=9200.0,
        imageUrl="https://picsum.photos/seed/calligraphy1/400/300",
        startTime=now - timedelta(days=1),
        endTime=now + timedelta(days=3),
        bids=mock_bids_2,
    ),
    Item(
        id=3,
        auctionId=1,
        name="和田玉挂件",
        description="新疆和田羊脂白玉挂件，质地细腻温润，雕工精湛。",
        startPrice=1000.0,
        currentPrice=2800.0,
        imageUrl="https://picsum.photos/seed/jade1/400/300",
        startTime=now - timedelta(days=2),
        endTime=now + timedelta(days=1),
        bids=mock_bids_3,
    ),
    Item(
        id=4,
        auctionId=1,
        name="瑞士机械腕表",
        description="瑞士百达翡丽经典款机械腕表，走时精准，收藏价值极高。",
        startPrice=15000.0,
        currentPrice=22000.0,
        imageUrl="https://picsum.photos/seed/watch1/400/300",
        startTime=now - timedelta(days=1),
        endTime=now + timedelta(days=4),
        bids=mock_bids_4,
    ),
    Item(
        id=5,
        auctionId=1,
        name="宋代汝窑茶盏",
        description="宋代汝窑天青釉茶盏，釉色如雨后天空，开片自然。",
        startPrice=3000.0,
        currentPrice=5000.0,
        imageUrl="https://picsum.photos/seed/tea1/400/300",
        startTime=now - timedelta(days=1),
        endTime=now + timedelta(days=2, hours=12),
        bids=mock_bids_5,
    ),
]

mock_items_2 = [
    Item(
        id=6,
        auctionId=2,
        name="陈年老酒茅台",
        description="1990年生产的贵州茅台酒，酱香浓郁，存放完好。",
        startPrice=2000.0,
        currentPrice=3800.0,
        imageUrl="https://picsum.photos/seed/maotai1/400/300",
        startTime=now - timedelta(hours=12),
        endTime=now + timedelta(days=1),
        bids=mock_bids_6,
    ),
    Item(
        id=7,
        auctionId=2,
        name="油画风景作品",
        description="当代著名油画家原创作品，描绘江南水乡美景。",
        startPrice=4000.0,
        currentPrice=6000.0,
        imageUrl="https://picsum.photos/seed/painting1/400/300",
        startTime=now - timedelta(hours=8),
        endTime=now + timedelta(days=2),
        bids=mock_bids_7,
    ),
    Item(
        id=8,
        auctionId=2,
        name="翡翠手镯",
        description="缅甸老坑冰种翡翠手镯，通透莹润，色泽翠绿。",
        startPrice=10000.0,
        currentPrice=12000.0,
        imageUrl="https://picsum.photos/seed/jadeite1/400/300",
        startTime=now - timedelta(hours=6),
        endTime=now + timedelta(days=3),
        bids=[],
    ),
    Item(
        id=9,
        auctionId=2,
        name="紫砂茶壶",
        description="宜兴紫砂大师手工制作，泥料上乘，工艺精湛。",
        startPrice=1500.0,
        currentPrice=2200.0,
        imageUrl="https://picsum.photos/seed/zisha1/400/300",
        startTime=now - timedelta(hours=10),
        endTime=now + timedelta(days=1, hours=6),
        bids=[
            Bid(id=26, userId=12, userName="茶客老吴", amount=1800.0, time=now - timedelta(hours=5)),
            Bid(id=27, userId=13, userName="紫砂迷", amount=2200.0, time=now - timedelta(hours=2)),
        ],
    ),
    Item(
        id=10,
        auctionId=2,
        name="古籍善本一套",
        description="清代木刻版古籍善本一套，共十册，保存完好。",
        startPrice=6000.0,
        currentPrice=7500.0,
        imageUrl="https://picsum.photos/seed/book1/400/300",
        startTime=now - timedelta(hours=4),
        endTime=now + timedelta(days=4),
        bids=[
            Bid(id=28, userId=14, userName="书虫先生", amount=6500.0, time=now - timedelta(hours=2)),
            Bid(id=29, userId=15, userName="古籍藏家", amount=7500.0, time=now - timedelta(hours=1)),
        ],
    ),
    Item(
        id=11,
        auctionId=2,
        name="钻石戒指",
        description="1克拉铂金钻戒，GIA认证，D色VVS1净度。",
        startPrice=25000.0,
        currentPrice=28000.0,
        imageUrl="https://picsum.photos/seed/diamond1/400/300",
        startTime=now - timedelta(hours=2),
        endTime=now + timedelta(days=5),
        bids=[
            Bid(id=30, userId=16, userName="珠宝收藏家", amount=28000.0, time=now - timedelta(hours=1)),
        ],
    ),
    Item(
        id=12,
        auctionId=2,
        name="紫檀木家具",
        description="明代紫檀木八仙桌，包浆自然，木纹精美。",
        startPrice=30000.0,
        currentPrice=30000.0,
        imageUrl="https://picsum.photos/seed/furniture1/400/300",
        startTime=now - timedelta(hours=1),
        endTime=now + timedelta(days=6),
        bids=[],
    ),
]

mock_items_3 = [
    Item(
        id=13,
        auctionId=3,
        name="当代艺术雕塑",
        description="知名当代艺术家限量版雕塑作品，全球仅99件。",
        startPrice=8000.0,
        currentPrice=9500.0,
        imageUrl="https://picsum.photos/seed/sculpture1/400/300",
        startTime=now - timedelta(days=2),
        endTime=now + timedelta(hours=12),
        bids=[
            Bid(id=31, userId=17, userName="艺术先锋", amount=8500.0, time=now - timedelta(days=1)),
            Bid(id=32, userId=18, userName="当代美术馆", amount=9500.0, time=now - timedelta(hours=6)),
        ],
    ),
    Item(
        id=14,
        auctionId=3,
        name="限量版球鞋",
        description="Nike Air Mag 回到未来限量版，全新未穿。",
        startPrice=5000.0,
        currentPrice=6800.0,
        imageUrl="https://picsum.photos/seed/sneaker1/400/300",
        startTime=now - timedelta(days=1),
        endTime=now + timedelta(hours=6),
        bids=[
            Bid(id=33, userId=19, userName="球鞋玩家", amount=5500.0, time=now - timedelta(hours=8)),
            Bid(id=34, userId=20, userName="sneakerhead", amount=6200.0, time=now - timedelta(hours=4)),
            Bid(id=35, userId=19, userName="球鞋玩家", amount=6800.0, time=now - timedelta(hours=2)),
        ],
    ),
    Item(
        id=15,
        auctionId=3,
        name="黑胶唱片合集",
        description="经典摇滚乐队黑胶唱片12张，含珍贵首版。",
        startPrice=2000.0,
        currentPrice=3200.0,
        imageUrl="https://picsum.photos/seed/vinyl1/400/300",
        startTime=now - timedelta(days=1),
        endTime=now + timedelta(hours=3),
        bids=[
            Bid(id=36, userId=21, userName="黑胶迷", amount=2300.0, time=now - timedelta(hours=10)),
            Bid(id=37, userId=22, userName="音乐老炮", amount=2800.0, time=now - timedelta(hours=5)),
            Bid(id=38, userId=21, userName="黑胶迷", amount=3200.0, time=now - timedelta(hours=2)),
        ],
    ),
    Item(
        id=16,
        auctionId=3,
        name="复古相机",
        description="徕卡M3胶卷相机，50年代产，功能完好。",
        startPrice=4000.0,
        currentPrice=5500.0,
        imageUrl="https://picsum.photos/seed/camera1/400/300",
        startTime=now - timedelta(days=2),
        endTime=now + timedelta(hours=8),
        bids=[
            Bid(id=39, userId=23, userName="胶片党", amount=4500.0, time=now - timedelta(days=1)),
            Bid(id=40, userId=24, userName="复古摄影", amount=5500.0, time=now - timedelta(hours=3)),
        ],
    ),
    Item(
        id=17,
        auctionId=3,
        name="邮票收藏册",
        description="新中国成立初期珍贵邮票收藏册，含多枚稀有票品。",
        startPrice=3000.0,
        currentPrice=4200.0,
        imageUrl="https://picsum.photos/seed/stamp1/400/300",
        startTime=now - timedelta(days=1),
        endTime=now + timedelta(hours=18),
        bids=[
            Bid(id=41, userId=25, userName="邮币收藏家", amount=3500.0, time=now - timedelta(hours=12)),
            Bid(id=42, userId=26, userName="老集邮迷", amount=4200.0, time=now - timedelta(hours=6)),
        ],
    ),
]

auctions: List[Auction] = [
    Auction(
        id=1,
        name="春季古董艺术品拍卖会",
        description="汇聚明清瓷器、名家书画、珠宝玉器等百余件珍品，不容错过的收藏盛宴。",
        imageUrl="https://picsum.photos/seed/auction1/600/400",
        startTime=now - timedelta(days=1),
        endTime=now + timedelta(days=4),
        itemCount=len(mock_items_1),
        items=mock_items_1,
    ),
    Auction(
        id=2,
        name="珠宝名酒精品专场",
        description="精选翡翠钻石、陈年佳酿、紫砂陶瓷等高端拍品，品质保证。",
        imageUrl="https://picsum.photos/seed/auction2/600/400",
        startTime=now - timedelta(hours=12),
        endTime=now + timedelta(days=6),
        itemCount=len(mock_items_2),
        items=mock_items_2,
    ),
    Auction(
        id=3,
        name="潮流艺术收藏专场",
        description="当代艺术、限量潮玩、复古好物，年轻收藏家的首选。",
        imageUrl="https://picsum.photos/seed/auction3/600/400",
        startTime=now - timedelta(days=2),
        endTime=now + timedelta(hours=20),
        itemCount=len(mock_items_3),
        items=mock_items_3,
    ),
]

all_items: List[Item] = mock_items_1 + mock_items_2 + mock_items_3

user_favorites: dict[int, List[int]] = {
    1: [1, 3, 6],
    2: [2, 4],
    3: [1, 7],
}

next_bid_id = 100


@app.get("/api/auctions")
def get_auctions() -> List[Auction]:
    return [
        Auction(
            id=a.id,
            name=a.name,
            description=a.description,
            imageUrl=a.imageUrl,
            startTime=a.startTime,
            endTime=a.endTime,
            itemCount=a.itemCount,
        )
        for a in auctions
    ]


@app.get("/api/auctions/{id}")
def get_auction_detail(id: int) -> Auction:
    auction = next((a for a in auctions if a.id == id), None)
    if not auction:
        raise HTTPException(status_code=404, detail="拍卖会不存在")
    return auction


@app.get("/api/items/{id}")
def get_item_detail(id: int) -> Item:
    item = next((i for i in all_items if i.id == id), None)
    if not item:
        raise HTTPException(status_code=404, detail="拍品不存在")
    return item


@app.post("/api/items/{id}/bid")
def place_bid(id: int, bid_req: BidRequest) -> Bid:
    global next_bid_id
    item = next((i for i in all_items if i.id == id), None)
    if not item:
        raise HTTPException(status_code=404, detail="拍品不存在")
    if now >= item.endTime:
        raise HTTPException(status_code=400, detail="拍卖已结束")
    if bid_req.amount <= item.currentPrice:
        raise HTTPException(status_code=400, detail="出价必须高于当前最高价")
    new_bid = Bid(
        id=next_bid_id,
        userId=bid_req.userId,
        userName=f"用户{bid_req.userId}",
        amount=bid_req.amount,
        time=now,
    )
    next_bid_id += 1
    item.bids.append(new_bid)
    item.currentPrice = bid_req.amount
    return new_bid


@app.get("/api/users/{id}/bids")
def get_user_bids(id: int) -> List[UserBid]:
    user_bids: List[UserBid] = []
    for item in all_items:
        for bid in item.bids:
            if bid.userId == id:
                is_winning = item.bids and item.bids[-1].userId == id
                user_bids.append(
                    UserBid(
                        id=bid.id,
                        userId=id,
                        itemId=item.id,
                        itemName=item.name,
                        itemImageUrl=item.imageUrl,
                        amount=bid.amount,
                        time=bid.time,
                        isWinning=is_winning,
                    )
                )
    user_bids.sort(key=lambda b: b.time, reverse=True)
    return user_bids


@app.get("/api/users/{id}/favorites")
def get_user_favorites(id: int) -> List[FavoriteItem]:
    fav_item_ids = user_favorites.get(id, [])
    favorites: List[FavoriteItem] = []
    for item_id in fav_item_ids:
        item = next((i for i in all_items if i.id == item_id), None)
        if item:
            favorites.append(
                FavoriteItem(
                    id=item.id,
                    itemId=item.id,
                    itemName=item.name,
                    itemImageUrl=item.imageUrl,
                    currentPrice=item.currentPrice,
                    endTime=item.endTime,
                )
            )
    return favorites


@app.post("/api/favorites/{itemId}")
def toggle_favorite(itemId: int, body: dict) -> dict:
    user_id = body.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="缺少userId")
    item = next((i for i in all_items if i.id == itemId), None)
    if not item:
        raise HTTPException(status_code=404, detail="拍品不存在")
    if user_id not in user_favorites:
        user_favorites[user_id] = []
    if itemId in user_favorites[user_id]:
        user_favorites[user_id].remove(itemId)
        return {"isFavorite": False, "message": "已取消收藏"}
    else:
        user_favorites[user_id].append(itemId)
        return {"isFavorite": True, "message": "已添加收藏"}
