from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

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
