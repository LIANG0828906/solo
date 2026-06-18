from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

DATABASE_URL = "sqlite:///./recipes.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    duration = Column(Integer)
    difficulty = Column(String)
    image_url = Column(String, nullable=True)
    steps = Column(String, nullable=True)

    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    name = Column(String, index=True)
    quantity = Column(String)
    category = Column(String, default="其他")

    recipe = relationship("Recipe", back_populates="ingredients")
