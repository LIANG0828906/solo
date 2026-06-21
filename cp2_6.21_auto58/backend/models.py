from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    cooking_time = Column(Integer, nullable=False)
    steps = Column(Text, nullable=False)
    image_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    quantity = Column(String(50), nullable=False)
    unit = Column(String(20), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    category = Column(String(20), nullable=False, default="其他")

    recipe = relationship("Recipe", back_populates="ingredients")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    quantity = Column(String(50), nullable=False)
    unit = Column(String(20), nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    category = Column(String(20), nullable=False, default="其他")


class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    quantity = Column(String(50), nullable=False)
    unit = Column(String(20), nullable=False)
    category = Column(String(20), nullable=False, default="其他")
    is_checked = Column(Boolean, default=False)
    shopping_list_id = Column(Integer, nullable=True)
