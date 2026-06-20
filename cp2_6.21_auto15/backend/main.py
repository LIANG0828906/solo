from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid
import os

from models import Base, engine, Product, Order, DeliveryOrder, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="电商后端 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProductBase(BaseModel):
    name: str
    category: str
    price: float
    stock: int
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None


class ProductResponse(ProductBase):
    id: int

    class Config:
        orm_mode = True


class CartItem(BaseModel):
    product_id: int
    quantity: int


class OrderItem(BaseModel):
    product_id: int
    product_name: str
    price: float
    quantity: int


class OrderCreate(BaseModel):
    user: str
    items: List[OrderItem]
    total: float
    address: Optional[str] = ""


class OrderResponse(BaseModel):
    id: int
    user: str
    items: List[OrderItem]
    total: float
    status: str
    address: str
    created_at: datetime

    class Config:
        orm_mode = True


class StockUpdateBody(BaseModel):
    stock: int


class OptimizeRouteRequest(BaseModel):
    delivery_id: Optional[int] = None
    order_ids: Optional[List[int]] = None
    addresses: Optional[List[str]] = None


class MergeOrderRequest(BaseModel):
    order_ids: List[int]


class DeliveryOrderRequest(BaseModel):
    order_ids: List[int]
    addresses: List[str]


class DeliveryOrderResponse(BaseModel):
    id: int
    order_ids: List[int]
    addresses: List[str]
    optimized_route: List[str]

    class Config:
        orm_mode = True


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def optimize_route(addresses: List[str]) -> List[str]:
    return addresses + [f"配送完成 - 回到仓库"]


@app.on_event("startup")
def init_mock_data():
    db = next(get_db())
    try:
        if db.query(Product).count() == 0:
            mock_products = [
                Product(name="新鲜红富士苹果", category="水果", price=6.9, stock=15, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20red%20fuji%20apple%20pile%20on%20white%20background%20product%20photo&image_size=square_hd"),
                Product(name="海南香蕉", category="水果", price=4.5, stock=30, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=yellow%20banana%20bunch%20tropical%20fruit%20product%20photo&image_size=square_hd"),
                Product(name="阳光玫瑰葡萄", category="水果", price=28.0, stock=12, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shine%20muscat%20green%20grape%20premium%20fruit%20product%20photo&image_size=square_hd"),
                Product(name="有机胡萝卜", category="蔬菜", price=3.8, stock=50, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=organic%20carrots%20fresh%20vegetable%20on%20white%20background&image_size=square_hd"),
                Product(name="上海青", category="蔬菜", price=2.5, stock=3, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shanghai%20green%20bok%20choy%20fresh%20vegetable%20product&image_size=square_hd"),
                Product(name="本地土鸡蛋", category="肉蛋", price=18.8, stock=18, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=farm%20fresh%20brown%20eggs%20in%20basket%20product%20photo&image_size=square_hd"),
                Product(name="散养土鸡", category="肉蛋", price=68.0, stock=8, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=raw%20whole%20free%20range%20chicken%20meat%20product%20photo&image_size=square_hd"),
                Product(name="金典纯牛奶", category="乳品", price=65.0, stock=45, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=milk%20carton%20box%20dairy%20product%20photo&image_size=square_hd"),
                Product(name="安慕希酸奶", category="乳品", price=55.0, stock=22, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=greek%20yogurt%20drink%20bottles%20dairy%20product&image_size=square_hd"),
                Product(name="金龙鱼食用油5L", category="粮油", price=79.9, stock=35, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cooking%20oil%20bottle%205%20liter%20kitchen%20product&image_size=square_hd"),
                Product(name="东北大米10kg", category="粮油", price=69.0, stock=5, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=northeast%20china%20rice%20bag%2010kg%20grain%20product&image_size=square_hd"),
                Product(name="维达抽纸", category="日用品", price=29.9, stock=60, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tissue%20paper%20box%20household%20product%20photo&image_size=square_hd"),
            ]
            db.add_all(mock_products)
            db.commit()
    except Exception as e:
        print(f"Init data error: {e}")
        db.rollback()


@app.get("/api/products", response_model=List[ProductResponse])
def get_products(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    return query.all()


@app.get("/api/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    return product


@app.post("/api/products", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@app.put("/api/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="商品不存在")
    
    update_data = product.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product


@app.put("/api/products/{product_id}/stock")
def update_stock(product_id: int, body: StockUpdateBody, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    
    if body.stock < 0:
        raise HTTPException(status_code=400, detail="库存不能为负数")
    
    product.stock = body.stock
    db.commit()
    db.refresh(product)
    return product


@app.post("/api/cart/add")
def add_to_cart(cart_item: CartItem, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == cart_item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    
    if product.stock < cart_item.quantity:
        raise HTTPException(status_code=400, detail="库存不足")
    
    return {
        "message": "已添加到购物车",
        "product": {
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "quantity": cart_item.quantity
        }
    }


@app.get("/api/orders", response_model=List[OrderResponse])
def get_orders(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    orders = query.order_by(Order.created_at.desc()).all()
    return orders


@app.post("/api/orders", response_model=OrderResponse)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"商品 {item.product_name} 不存在")
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"商品 {item.product_name} 库存不足")
        
        product.stock -= item.quantity
    
    db_order = Order(
        user=order.user,
        items=[item.dict() for item in order.items],
        total=order.total,
        status="pending",
        address=order.address or ""
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@app.put("/api/orders/merge", response_model=DeliveryOrderResponse)
def merge_orders(request: MergeOrderRequest, db: Session = Depends(get_db)):
    if len(request.order_ids) < 2:
        raise HTTPException(status_code=400, detail="至少需要2个订单才能合并")
    
    orders = db.query(Order).filter(Order.id.in_(request.order_ids)).all()
    if len(orders) != len(request.order_ids):
        raise HTTPException(status_code=404, detail="部分订单不存在")
    
    if any(order.status != "pending" for order in orders):
        raise HTTPException(status_code=400, detail="只能合并待处理的订单")
    
    addresses = []
    for order in orders:
        addr = order.address if order.address else f"{order.user}的地址-订单{order.id}"
        addresses.append(addr)
    
    optimized_route = optimize_route(addresses)
    
    delivery = DeliveryOrder(
        order_ids=request.order_ids,
        addresses=addresses,
        optimized_route=optimized_route
    )
    db.add(delivery)
    
    for order in orders:
        order.status = "merged"
    
    db.commit()
    db.refresh(delivery)
    
    return delivery


@app.post("/api/delivery/optimize", response_model=DeliveryOrderResponse)
def optimize_delivery(request: OptimizeRouteRequest, db: Session = Depends(get_db)):
    if request.delivery_id:
        delivery = db.query(DeliveryOrder).filter(DeliveryOrder.id == request.delivery_id).first()
        if not delivery:
            raise HTTPException(status_code=404, detail="配送单不存在")
        addresses = delivery.addresses
    elif request.order_ids and request.addresses:
        addresses = request.addresses
    else:
        raise HTTPException(status_code=400, detail="请提供配送单ID或订单ID列表与地址")
    
    import random
    shuffled = addresses.copy()
    random.shuffle(shuffled)
    optimized_route = shuffled + [f"配送完成 - 回到仓库"]
    
    if request.delivery_id:
        delivery.optimized_route = optimized_route
        db.commit()
        db.refresh(delivery)
        return delivery
    else:
        delivery = DeliveryOrder(
            order_ids=request.order_ids or [],
            addresses=request.addresses or [],
            optimized_route=optimized_route
        )
        db.add(delivery)
        db.commit()
        db.refresh(delivery)
        return delivery


@app.get("/api/delivery/list", response_model=List[DeliveryOrderResponse])
def get_delivery_list(db: Session = Depends(get_db)):
    deliveries = db.query(DeliveryOrder).order_by(DeliveryOrder.id.desc()).all()
    return deliveries


@app.get("/api/delivery/{delivery_id}", response_model=DeliveryOrderResponse)
def get_delivery(delivery_id: int, db: Session = Depends(get_db)):
    delivery = db.query(DeliveryOrder).filter(DeliveryOrder.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="配送单不存在")
    return delivery


@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    return {"url": f"/{UPLOAD_DIR}/{file_name}", "filename": file_name}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
