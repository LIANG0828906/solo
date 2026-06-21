import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

VALID_FLAVOR_IDS = {'sea-salt-caramel', 'matcha', 'dark-chocolate', 'strawberry', 'pistachio', 'baileys'}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChocolateItem(BaseModel):
    id: str
    flavorId: str
    shape: str
    color: str
    texture: str

class GiftBoxConfig(BaseModel):
    boxShape: str
    ribbonColor: str
    cardText: str
    cardFont: str
    cardColor: str

class OrderCreate(BaseModel):
    chocolates: List[ChocolateItem]
    giftBox: GiftBoxConfig

class OrderResponse(BaseModel):
    orderId: str
    status: str = "pending"
    createdAt: str
    chocolates: List[ChocolateItem]
    giftBox: GiftBoxConfig

orders_db: dict[str, OrderResponse] = {}

@app.post("/api/orders", response_model=OrderResponse)
def create_order(order: OrderCreate):
    if len(order.chocolates) < 3 or len(order.chocolates) > 6:
        raise HTTPException(status_code=400, detail="巧克力数量必须在3-6颗之间")
    for chocolate in order.chocolates:
        if chocolate.flavorId not in VALID_FLAVOR_IDS:
            raise HTTPException(status_code=400, detail=f"无效的口味ID: {chocolate.flavorId}")
        if not re.match(r'^#[0-9A-Fa-f]{6}$', chocolate.color):
            raise HTTPException(status_code=400, detail=f"无效的颜色格式: {chocolate.color}. 必须是十六进制如 #RRGGBB")
        if chocolate.shape not in {'circle', 'square', 'heart', 'shell'}:
            raise HTTPException(status_code=400, detail=f"无效的形状: {chocolate.shape}")
        if chocolate.texture not in {'matte', 'glossy', 'crushed-nuts', 'gold-foil'}:
            raise HTTPException(status_code=400, detail=f"无效的纹理: {chocolate.texture}")
    if order.giftBox.boxShape not in {'square', 'heart', 'drawer'}:
        raise HTTPException(status_code=400, detail=f"无效的礼盒形状: {order.giftBox.boxShape}")
    if len(order.giftBox.cardText) > 200:
        raise HTTPException(status_code=400, detail="贺卡文字不能超过200个字符")
    order_id = str(uuid4())
    response = OrderResponse(
        orderId=order_id,
        createdAt=datetime.now().isoformat(),
        chocolates=order.chocolates,
        giftBox=order.giftBox,
    )
    orders_db[order_id] = response
    return response

@app.get("/api/orders", response_model=List[OrderResponse])
def list_orders():
    return list(orders_db.values())

@app.get("/api/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: str):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")
    return orders_db[order_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
