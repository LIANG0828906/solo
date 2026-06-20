from sqlalchemy import Column, Integer, String, Float, JSON
from database import Base


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    quantity_grams = Column(Float, default=0)
    expiry_date = Column(String, nullable=True)
    nutrition_per_100g = Column(JSON, default={})


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    cook_time_minutes = Column(Integer)
    ingredients = Column(JSON, default=[])
    steps = Column(JSON, default=[])
    nutrition = Column(JSON, default={})
    image = Column(String, nullable=True)
    dietary_tags = Column(JSON, default=[])
