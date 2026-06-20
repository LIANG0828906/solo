from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import json

SQLALCHEMY_DATABASE_URL = "sqlite:///./ecommerce.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    image_url = Column(String(500))


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String(255), nullable=False)
    items_json = Column(Text, nullable=False)
    total = Column(Float, nullable=False)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def items(self):
        return json.loads(self.items_json) if self.items_json else []

    @items.setter
    def items(self, value):
        self.items_json = json.dumps(value, ensure_ascii=False)


class DeliveryOrder(Base):
    __tablename__ = "delivery_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_ids_json = Column(Text, nullable=False)
    addresses_json = Column(Text, nullable=False)
    optimized_route_json = Column(Text)

    @property
    def order_ids(self):
        return json.loads(self.order_ids_json) if self.order_ids_json else []

    @order_ids.setter
    def order_ids(self, value):
        self.order_ids_json = json.dumps(value)

    @property
    def addresses(self):
        return json.loads(self.addresses_json) if self.addresses_json else []

    @addresses.setter
    def addresses(self, value):
        self.addresses_json = json.dumps(value, ensure_ascii=False)

    @property
    def optimized_route(self):
        return json.loads(self.optimized_route_json) if self.optimized_route_json else []

    @optimized_route.setter
    def optimized_route(self, value):
        self.optimized_route_json = json.dumps(value, ensure_ascii=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
