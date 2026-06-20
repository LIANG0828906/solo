from sqlalchemy import Column, Integer, String, Float, JSON, Text
from database import Base


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), index=True, nullable=False)
    quantity_grams = Column(Float, default=0)
    expiry_date = Column(String(20), nullable=True)
    nutrition_per_100g = Column(JSON, default={})


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), index=True, nullable=False)
    description = Column(Text, default="")
    cook_time_minutes = Column(Integer, default=0)
    ingredients = Column(JSON, default=[])
    steps = Column(JSON, default=[])
    nutrition = Column(JSON, default={})
    image = Column(String(500), nullable=True)
    dietary_tags = Column(JSON, default=[])
