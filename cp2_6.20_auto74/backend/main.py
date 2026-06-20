from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from database import engine, SessionLocal, get_db, Base
from models import Ingredient, Recipe
from recommender import (
    recommend_recipes,
    get_all_recipes,
    get_recipe_by_id,
    SAMPLE_RECIPES,
)


Base.metadata.create_all(bind=engine)


app = FastAPI(title="冰箱大厨 API", description="基于食材的智能菜谱推荐系统")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class IngredientCreate(BaseModel):
    name: str
    quantity_grams: float = 0
    expiry_date: Optional[str] = None
    nutrition_per_100g: dict = {}


class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    quantity_grams: Optional[float] = None
    expiry_date: Optional[str] = None
    nutrition_per_100g: Optional[dict] = None


class RecommendRequest(BaseModel):
    ingredients: List[str]
    dietary_filter: Optional[str] = None


def init_sample_data():
    db = SessionLocal()
    try:
        if db.query(Ingredient).count() == 0:
            sample_ingredients = [
                Ingredient(
                    name="番茄",
                    quantity_grams=500,
                    expiry_date="2025-07-10",
                    nutrition_per_100g={"calories": 20, "protein": 0.9, "fat": 0.2, "carbs": 3.9},
                ),
                Ingredient(
                    name="鸡蛋",
                    quantity_grams=300,
                    expiry_date="2025-07-15",
                    nutrition_per_100g={"calories": 155, "protein": 13, "fat": 11, "carbs": 1.1},
                ),
                Ingredient(
                    name="土豆",
                    quantity_grams=800,
                    expiry_date="2025-07-20",
                    nutrition_per_100g={"calories": 77, "protein": 2, "fat": 0.1, "carbs": 17},
                ),
                Ingredient(
                    name="鸡胸肉",
                    quantity_grams=400,
                    expiry_date="2025-07-08",
                    nutrition_per_100g={"calories": 165, "protein": 31, "fat": 3.6, "carbs": 0},
                ),
                Ingredient(
                    name="西兰花",
                    quantity_grams=600,
                    expiry_date="2025-07-12",
                    nutrition_per_100g={"calories": 34, "protein": 2.8, "fat": 0.4, "carbs": 7},
                ),
                Ingredient(
                    name="豆腐",
                    quantity_grams=400,
                    expiry_date="2025-07-10",
                    nutrition_per_100g={"calories": 76, "protein": 8, "fat": 4.8, "carbs": 1.9},
                ),
            ]
            db.add_all(sample_ingredients)
            db.commit()
    finally:
        db.close()


init_sample_data()


@app.get("/api/ingredients")
def get_ingredients(db: Session = Depends(get_db)):
    ingredients = db.query(Ingredient).all()
    return [
        {
            "id": ing.id,
            "name": ing.name,
            "quantity_grams": ing.quantity_grams,
            "expiry_date": ing.expiry_date,
            "nutrition_per_100g": ing.nutrition_per_100g,
        }
        for ing in ingredients
    ]


@app.post("/api/ingredients")
def create_ingredient(ingredient: IngredientCreate, db: Session = Depends(get_db)):
    db_ingredient = Ingredient(
        name=ingredient.name,
        quantity_grams=ingredient.quantity_grams,
        expiry_date=ingredient.expiry_date,
        nutrition_per_100g=ingredient.nutrition_per_100g,
    )
    db.add(db_ingredient)
    db.commit()
    db.refresh(db_ingredient)
    return {
        "id": db_ingredient.id,
        "name": db_ingredient.name,
        "quantity_grams": db_ingredient.quantity_grams,
        "expiry_date": db_ingredient.expiry_date,
        "nutrition_per_100g": db_ingredient.nutrition_per_100g,
    }


@app.put("/api/ingredients/{ingredient_id}")
def update_ingredient(
    ingredient_id: int,
    ingredient: IngredientUpdate,
    db: Session = Depends(get_db),
):
    db_ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not db_ingredient:
        raise HTTPException(status_code=404, detail="食材未找到")

    if ingredient.name is not None:
        db_ingredient.name = ingredient.name
    if ingredient.quantity_grams is not None:
        db_ingredient.quantity_grams = ingredient.quantity_grams
    if ingredient.expiry_date is not None:
        db_ingredient.expiry_date = ingredient.expiry_date
    if ingredient.nutrition_per_100g is not None:
        db_ingredient.nutrition_per_100g = ingredient.nutrition_per_100g

    db.commit()
    db.refresh(db_ingredient)
    return {
        "id": db_ingredient.id,
        "name": db_ingredient.name,
        "quantity_grams": db_ingredient.quantity_grams,
        "expiry_date": db_ingredient.expiry_date,
        "nutrition_per_100g": db_ingredient.nutrition_per_100g,
    }


@app.delete("/api/ingredients/{ingredient_id}")
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    db_ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not db_ingredient:
        raise HTTPException(status_code=404, detail="食材未找到")

    db.delete(db_ingredient)
    db.commit()
    return {"message": "删除成功"}


@app.get("/api/recipes")
def get_recipes(dietary_filter: Optional[str] = None):
    recipes = get_all_recipes(dietary_filter)
    return recipes


@app.get("/api/recipes/{recipe_id}")
def get_recipe(recipe_id: int):
    recipe = get_recipe_by_id(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="菜谱未找到")
    return recipe


@app.post("/api/recipes/recommend")
def recommend(request: RecommendRequest):
    recipes = recommend_recipes(request.ingredients, request.dietary_filter)
    return recipes


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "冰箱大厨 API 运行正常"}
