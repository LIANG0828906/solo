from sqlalchemy import create_engine, Column, Integer, String, Boolean, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel

SQLALCHEMY_DATABASE_URL = "sqlite:///./habits.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class HabitRecord(Base):
    __tablename__ = "habit_records"

    id = Column(Integer, primary_key=True, index=True)
    habit_name = Column(String, nullable=False)
    date = Column(String, nullable=False)
    completed = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        Index("idx_habit_date", "habit_name", "date", unique=True),
        Index("idx_date", "date"),
    )


class HabitName(BaseModel):
    habit_name: str


class ToggleRecord(BaseModel):
    habit_name: str
    date: str


class HabitRecordResponse(BaseModel):
    id: int
    habit_name: str
    date: str
    completed: bool

    class Config:
        from_attributes = True
