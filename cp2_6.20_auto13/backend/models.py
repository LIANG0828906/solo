from datetime import datetime
from sqlalchemy import String, Float, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    username: Mapped[str] = mapped_column(String)
    password_hash: Mapped[str] = mapped_column(String)
    avatar: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    recipes: Mapped[list["Recipe"]] = relationship(back_populates="creator")
    ratings: Mapped[list["Rating"]] = relationship(back_populates="user")
    favorite_folders: Mapped[list["FavoriteFolder"]] = relationship(back_populates="user")


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    thumbnail: Mapped[str] = mapped_column(String, default="")
    images_json: Mapped[str] = mapped_column(Text, default="[]")
    prep_time: Mapped[int] = mapped_column(Integer, default=0)
    cook_time: Mapped[int] = mapped_column(Integer, default=0)
    difficulty: Mapped[str] = mapped_column(String, default="medium")
    avg_rating: Mapped[float] = mapped_column(Float, default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    creator_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator: Mapped["User"] = relationship(back_populates="recipes")
    ingredients: Mapped[list["Ingredient"]] = relationship(back_populates="recipe", cascade="all, delete-orphan")
    steps: Mapped[list["Step"]] = relationship(back_populates="recipe", cascade="all, delete-orphan")
    ratings: Mapped[list["Rating"]] = relationship(back_populates="recipe", cascade="all, delete-orphan")
    versions: Mapped[list["VersionSnapshot"]] = relationship(back_populates="recipe", cascade="all, delete-orphan")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    recipe_id: Mapped[str] = mapped_column(String, ForeignKey("recipes.id"))
    name: Mapped[str] = mapped_column(String)
    amount: Mapped[float] = mapped_column(Float, default=0)
    unit: Mapped[str] = mapped_column(String, default="")
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    recipe: Mapped["Recipe"] = relationship(back_populates="ingredients")


class Step(Base):
    __tablename__ = "steps"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    recipe_id: Mapped[str] = mapped_column(String, ForeignKey("recipes.id"))
    title: Mapped[str] = mapped_column(String, default="")
    content: Mapped[str] = mapped_column(Text, default="")
    images_json: Mapped[str] = mapped_column(Text, default="[]")
    timer_seconds: Mapped[int] = mapped_column(Integer, default=0)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    recipe: Mapped["Recipe"] = relationship(back_populates="steps")


class Rating(Base):
    __tablename__ = "ratings"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    recipe_id: Mapped[str] = mapped_column(String, ForeignKey("recipes.id"))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    score: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    recipe: Mapped["Recipe"] = relationship(back_populates="ratings")
    user: Mapped["User"] = relationship(back_populates="ratings")


class FavoriteFolder(Base):
    __tablename__ = "favorite_folders"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="favorite_folders")
    recipes: Mapped[list["FavoriteRecipe"]] = relationship(back_populates="folder", cascade="all, delete-orphan")


class FavoriteRecipe(Base):
    __tablename__ = "favorite_recipes"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    folder_id: Mapped[str] = mapped_column(String, ForeignKey("favorite_folders.id"))
    recipe_id: Mapped[str] = mapped_column(String, ForeignKey("recipes.id"))

    folder: Mapped["FavoriteFolder"] = relationship(back_populates="recipes")


class VersionSnapshot(Base):
    __tablename__ = "version_snapshots"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    recipe_id: Mapped[str] = mapped_column(String, ForeignKey("recipes.id"))
    snapshot_json: Mapped[str] = mapped_column(Text)
    created_by: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    recipe: Mapped["Recipe"] = relationship(back_populates="versions")


class Collaborator(Base):
    __tablename__ = "collaborators"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    recipe_id: Mapped[str] = mapped_column(String, ForeignKey("recipes.id"))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
