from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

SQLALCHEMY_DATABASE_URL = "sqlite:///./leather_workshop.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    price = Column(Float, nullable=False)
    image_url = Column(String, default="")
    stock = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    inquiries = relationship("Inquiry", back_populates="product")


class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    customer_name = Column(String, nullable=False)
    contact = Column(String, nullable=False)
    message = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="inquiries")

    __table_args__ = (
        Index("ix_inquiries_product_id", "product_id"),
        Index("ix_inquiries_created_at", "created_at"),
    )


Base.metadata.create_all(bind=engine)


class ProductBase(BaseModel):
    name: str
    description: str = ""
    price: float
    image_url: str = ""
    stock: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class InquiryBase(BaseModel):
    product_id: int
    customer_name: str
    contact: str
    message: str = ""


class InquiryCreate(InquiryBase):
    pass


class InquiryResponse(InquiryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def init_db():
    db = SessionLocal()
    try:
        count = db.query(Product).count()
        if count == 0:
            sample_products = [
                Product(
                    name="手工皮革钱包",
                    description="采用头层牛皮手工缝制，经典三折设计，多卡位分层，复古黄铜五金配件，每一件都凝聚匠人心血。",
                    price=299.0,
                    image_url="https://picsum.photos/seed/wallet/400/300",
                    stock=15,
                ),
                Product(
                    name="复古皮质笔记本",
                    description="真皮封面手工笔记本，内含80g米黄道林纸100张，可定制烫印名字，是送给自己或友人的佳品。",
                    price=188.0,
                    image_url="https://picsum.photos/seed/notebook/400/300",
                    stock=30,
                ),
                Product(
                    name="棕色牛皮皮带",
                    description="意大利进口头层牛皮，实心黄铜带扣，手工封边处理，长度可自由裁剪，商务休闲两相宜。",
                    price=358.0,
                    image_url="https://picsum.photos/seed/belt/400/300",
                    stock=20,
                ),
                Product(
                    name="皮革钥匙扣",
                    description="小巧精致的牛皮钥匙扣，搭配复古铜环，可定制字母压印，是实用又有温度的小配饰。",
                    price=68.0,
                    image_url="https://picsum.photos/seed/keychain/400/300",
                    stock=50,
                ),
                Product(
                    name="手工单肩皮包",
                    description="全手工缝制的简约单肩包，容量适中，皮料会随使用时间愈发有光泽，是陪伴你多年的好物。",
                    price=899.0,
                    image_url="https://picsum.photos/seed/bag/400/300",
                    stock=8,
                ),
            ]
            for product in sample_products:
                db.add(product)
            db.commit()
    finally:
        db.close()


init_db()


@app.get("/api/products", response_model=list[ProductResponse])
def get_products():
    db = SessionLocal()
    try:
        products = db.query(Product).order_by(Product.created_at.desc()).all()
        return products
    finally:
        db.close()


@app.get("/api/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int):
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product
    finally:
        db.close()


@app.post("/api/products", response_model=ProductResponse)
def create_product(product: ProductCreate):
    db = SessionLocal()
    try:
        db_product = Product(**product.model_dump())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product
    finally:
        db.close()


@app.put("/api/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate):
    db = SessionLocal()
    try:
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            raise HTTPException(status_code=404, detail="Product not found")
        for key, value in product.model_dump().items():
            setattr(db_product, key, value)
        db.commit()
        db.refresh(db_product)
        return db_product
    finally:
        db.close()


@app.delete("/api/products/{product_id}")
def delete_product(product_id: int):
    db = SessionLocal()
    try:
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            raise HTTPException(status_code=404, detail="Product not found")
        db.delete(db_product)
        db.commit()
        return {"message": "Product deleted successfully"}
    finally:
        db.close()


@app.post("/api/inquiries", response_model=InquiryResponse)
def create_inquiry(inquiry: InquiryCreate):
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == inquiry.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        db_inquiry = Inquiry(**inquiry.model_dump())
        db.add(db_inquiry)
        db.commit()
        db.refresh(db_inquiry)
        return db_inquiry
    finally:
        db.close()


@app.get("/api/inquiries", response_model=list[InquiryResponse])
def get_inquiries():
    db = SessionLocal()
    try:
        inquiries = db.query(Inquiry).order_by(Inquiry.created_at.desc()).all()
        return inquiries
    finally:
        db.close()
