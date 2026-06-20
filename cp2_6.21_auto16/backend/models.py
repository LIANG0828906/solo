from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

SQLALCHEMY_DATABASE_URL = "sqlite:///./artworks.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    avatar = Column(String, nullable=False)
    wallet = Column(Float, default=0.0)

    bids = relationship("Bid", back_populates="user")


class Artwork(Base):
    __tablename__ = "artworks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    creator = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String, nullable=False)
    start_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    min_increment = Column(Float, nullable=False)
    highest_bidder = Column(String, nullable=True)
    end_time = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    bids = relationship("Bid", back_populates="artwork", cascade="all, delete-orphan")


class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    artwork_id = Column(Integer, ForeignKey("artworks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    username = Column(String, nullable=False)
    avatar = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    artwork = relationship("Artwork", back_populates="bids")
    user = relationship("User", back_populates="bids")


Base.metadata.create_all(bind=engine)
