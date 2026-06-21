import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Float, DateTime, Date, ForeignKey, Text, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON

from backend.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    nickname = Column(String, nullable=False)
    avatar_url = Column(String)
    room_id = Column(String, nullable=False, default="default-room")
    created_at = Column(DateTime, default=datetime.utcnow)

    recipes = relationship("Recipe", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    meal_plan_entries = relationship("MealPlanEntry", back_populates="added_by_user", cascade="all, delete-orphan")


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    thumbnail = Column(String)
    hero_image = Column(String)
    cook_time_minutes = Column(Integer, nullable=False)
    difficulty = Column(Integer, nullable=False)
    main_ingredients = Column(SQLiteJSON, nullable=False, default=list)
    steps = Column(SQLiteJSON, nullable=False, default=list)
    avg_rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", back_populates="recipes")
    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="recipe", cascade="all, delete-orphan")
    meal_plan_entries = relationship("MealPlanEntry", back_populates="recipe")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(String, primary_key=True, default=generate_uuid)
    recipe_id = Column(String, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    category = Column(String, nullable=False)
    estimated_price = Column(Float)

    recipe = relationship("Recipe", back_populates="ingredients")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String, primary_key=True, default=generate_uuid)
    recipe_id = Column(String, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    recipe = relationship("Recipe", back_populates="comments")
    user = relationship("User", back_populates="comments")


class MealPlanEntry(Base):
    __tablename__ = "meal_plan_entries"
    __table_args__ = (
        UniqueConstraint("room_id", "week_start", "day_of_week", "meal_slot", name="uq_meal_plan_slot"),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    room_id = Column(String, nullable=False)
    week_start = Column(String, nullable=False)
    day_of_week = Column(Integer, nullable=False)
    meal_slot = Column(String, nullable=False)
    recipe_id = Column(String, ForeignKey("recipes.id"), nullable=False)
    added_by = Column(String, ForeignKey("users.id"), nullable=False)

    recipe = relationship("Recipe", back_populates="meal_plan_entries")
    added_by_user = relationship("User", back_populates="meal_plan_entries")


class ShoppingListChecked(Base):
    __tablename__ = "shopping_list_checked"
    __table_args__ = (
        UniqueConstraint("room_id", "week_start", "ingredient_key", name="uq_shopping_checked"),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    room_id = Column(String, nullable=False)
    week_start = Column(String, nullable=False)
    ingredient_key = Column(String, nullable=False)
    purchased = Column(Integer, default=0)
    purchased_by = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
