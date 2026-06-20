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


class OrderResponse(BaseModel):
    id: int
    user: str
    items: List[OrderItem]
    total: float
    status: str
    created_at: datetime

    class Config:
        orm_mode = True


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
    if db.query(Product).count() == 0:
        mock_products = [
            Product(name="苹果 iPhone 15", category="手机数码", price=5999.0, stock=100, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%2015%20smartphone%20product%20photo&image_size=square"),
            Product(name="华为 Mate 60", category="手机数码", price=6999.0, stock=80, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Huawei%20Mate%2060%20smartphone%20product%20photo&image_size=square"),
            Product(name="小米 14", category="手机数码", price=3999.0, stock=150, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Xiaomi%2014%20smartphone%20product%20photo&image_size=square"),
            Product(name="MacBook Pro", category="电脑办公", price=12999.0, stock=50, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=MacBook%20Pro%20laptop%20product%20photo&image_size=square"),
            Product(name="ThinkPad X1", category="电脑办公", price=9999.0, stock=60, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ThinkPad%20X1%20laptop%20product%20photo&image_size=square"),
            Product(name="Nike Air Max", category="运动户外", price=899.0, stock=200, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Nike%20Air%20Max%20sneakers%20product%20photo&image_size=square"),
            Product(name="Adidas Ultraboost", category="运动户外", price=1099.0, stock=180, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Adidas%20Ultraboost%20sneakers%20product%20photo&image_size=square"),
            Product(name="戴森吸尘器", category="家用电器", price=2999.0, stock=70, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Dyson%20vacuum%20cleaner%20product%20photo&image_size=square"),
            Product(name="美的空调", category="家用电器", price=3599.0, stock=40, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Midea%20air%20conditioner%20product%20photo&image_size=square"),
            Product(name="SK-II 神仙水", category="美妆个护", price=1590.0, stock=90, image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=SK-II%20facial%20treatment%20essence%20product%20photo&image_size=square"),
        ]
        db.add_all(mock_products)
        db.commit()


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
def update_stock(product_id: int, quantity: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    
    if product.stock + quantity < 0:
        raise HTTPException(status_code=400, detail="库存不足")
    
    product.stock += quantity
    db.commit()
    return {"message": "库存更新成功", "new_stock": product.stock}


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
        status="pending"
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@app.put("/api/orders/merge")
def merge_orders(request: MergeOrderRequest, db: Session = Depends(get_db)):
    if len(request.order_ids) < 2:
        raise HTTPException(status_code=400, detail="至少需要2个订单才能合并")
    
    orders = db.query(Order).filter(Order.id.in_(request.order_ids)).all()
    if len(orders) != len(request.order_ids):
        raise HTTPException(status_code=404, detail="部分订单不存在")
    
    if any(order.status != "pending" for order in orders):
        raise HTTPException(status_code=400, detail="只能合并待处理的订单")
    
    merged_items = []
    total = 0.0
    for order in orders:
        merged_items.extend(order.items)
        total += order.total
    
    item_map = {}
    for item in merged_items:
        pid = item["product_id"]
        if pid in item_map:
            item_map[pid]["quantity"] += item["quantity"]
        else:
            item_map[pid] = item.copy()
    
    final_items = list(item_map.values())
    
    merged_order = Order(
        user=orders[0].user,
        items=final_items,
        total=sum(item["price"] * item["quantity"] for item in final_items),
        status="pending"
    )
    db.add(merged_order)
    
    for order in orders:
        order.status = "merged"
    
    db.commit()
    db.refresh(merged_order)
    
    return {
        "message": "订单合并成功",
        "merged_order_id": merged_order.id,
        "merged_from": request.order_ids
    }


@app.post("/api/delivery/optimize", response_model=DeliveryOrderResponse)
def optimize_delivery(request: DeliveryOrderRequest, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.id.in_(request.order_ids)).all()
    if len(orders) != len(request.order_ids):
        raise HTTPException(status_code=404, detail="部分订单不存在")
    
    if len(request.addresses) != len(request.order_ids):
        raise HTTPException(status_code=400, detail="地址数量与订单数量不匹配")
    
    optimized_route = optimize_route(request.addresses)
    
    delivery = DeliveryOrder(
        order_ids=request.order_ids,
        addresses=request.addresses,
        optimized_route=optimized_route
    )
    db.add(delivery)
    
    for order in orders:
        order.status = "delivering"
    
    db.commit()
    db.refresh(delivery)
    
    return delivery


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
