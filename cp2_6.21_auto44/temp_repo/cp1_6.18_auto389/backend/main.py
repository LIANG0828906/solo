import json
import sys
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import Base, engine, SessionLocal, Recipe, Ingredient

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class IngredientIn(BaseModel):
    name: str
    quantity: str
    category: str = "其他"


class RecipeCreate(BaseModel):
    name: str
    duration: int
    difficulty: str
    image_url: Optional[str] = None
    steps: Optional[str] = None
    ingredients: List[IngredientIn]


class RecipeOut(BaseModel):
    id: int
    name: str
    duration: int
    difficulty: str
    image_url: Optional[str]
    steps: Optional[str]


class RecipeWithIngredients(RecipeOut):
    ingredients: List[IngredientIn]
    matched_ingredients: Optional[List[str]] = None


class RecommendRequest(BaseModel):
    ingredients: List[str]


class IngredientOut(BaseModel):
    id: int
    name: str
    quantity: str
    category: str


def init_db():
    db = SessionLocal()
    if db.query(Recipe).count() == 0:
        sample_recipes = [
            {
                "name": "番茄炒蛋",
                "duration": 15,
                "difficulty": "简单",
                "image_url": "",
                "steps": json.dumps(["将番茄切块，鸡蛋打散", "热锅下油，炒鸡蛋盛出", "下番茄翻炒出汁", "加入鸡蛋翻炒均匀，加盐出锅"]),
                "ingredients": [
                    {"name": "番茄", "quantity": "2个", "category": "蔬菜"},
                    {"name": "鸡蛋", "quantity": "3个", "category": "其他"},
                    {"name": "盐", "quantity": "适量", "category": "调味品"},
                    {"name": "食用油", "quantity": "适量", "category": "调味品"},
                ],
            },
            {
                "name": "青椒肉丝",
                "duration": 20,
                "difficulty": "中等",
                "image_url": "",
                "steps": json.dumps(["青椒切丝，猪肉切丝", "肉丝用料酒、淀粉腌制", "热油滑炒肉丝盛出", "下青椒丝翻炒", "加入肉丝，加生抽调味"]),
                "ingredients": [
                    {"name": "青椒", "quantity": "2个", "category": "蔬菜"},
                    {"name": "猪肉", "quantity": "200g", "category": "肉类"},
                    {"name": "料酒", "quantity": "1勺", "category": "调味品"},
                    {"name": "淀粉", "quantity": "1勺", "category": "调味品"},
                    {"name": "生抽", "quantity": "1勺", "category": "调味品"},
                ],
            },
            {
                "name": "红烧肉",
                "duration": 60,
                "difficulty": "困难",
                "image_url": "",
                "steps": json.dumps(["五花肉切块焯水", "炒糖色至枣红色", "下肉块翻炒上色", "加料酒、生抽、老抽、八角", "加水炖煮40分钟收汁"]),
                "ingredients": [
                    {"name": "五花肉", "quantity": "500g", "category": "肉类"},
                    {"name": "冰糖", "quantity": "30g", "category": "调味品"},
                    {"name": "料酒", "quantity": "2勺", "category": "调味品"},
                    {"name": "生抽", "quantity": "2勺", "category": "调味品"},
                    {"name": "老抽", "quantity": "1勺", "category": "调味品"},
                    {"name": "八角", "quantity": "2个", "category": "调味品"},
                ],
            },
            {
                "name": "蒜蓉西兰花",
                "duration": 10,
                "difficulty": "简单",
                "image_url": "",
                "steps": json.dumps(["西兰花切小朵焯水", "大蒜切末", "热油爆香蒜末", "下西兰花快速翻炒", "加盐调味出锅"]),
                "ingredients": [
                    {"name": "西兰花", "quantity": "1颗", "category": "蔬菜"},
                    {"name": "大蒜", "quantity": "3瓣", "category": "蔬菜"},
                    {"name": "盐", "quantity": "适量", "category": "调味品"},
                    {"name": "食用油", "quantity": "适量", "category": "调味品"},
                ],
            },
            {
                "name": "土豆炖牛肉",
                "duration": 90,
                "difficulty": "困难",
                "image_url": "",
                "steps": json.dumps(["牛肉切块焯水", "土豆胡萝卜切块", "热油炒香葱姜", "下牛肉翻炒加调料", "加水炖1小时加土豆胡萝卜", "再炖20分钟收汁"]),
                "ingredients": [
                    {"name": "牛肉", "quantity": "500g", "category": "肉类"},
                    {"name": "土豆", "quantity": "2个", "category": "蔬菜"},
                    {"name": "胡萝卜", "quantity": "1根", "category": "蔬菜"},
                    {"name": "葱", "quantity": "1段", "category": "蔬菜"},
                    {"name": "姜", "quantity": "3片", "category": "蔬菜"},
                    {"name": "生抽", "quantity": "2勺", "category": "调味品"},
                    {"name": "料酒", "quantity": "2勺", "category": "调味品"},
                ],
            },
            {
                "name": "黄瓜鸡蛋汤",
                "duration": 10,
                "difficulty": "简单",
                "image_url": "",
                "steps": json.dumps(["黄瓜切片", "鸡蛋打散", "水烧开下黄瓜", "淋入蛋液形成蛋花", "加盐香油出锅"]),
                "ingredients": [
                    {"name": "黄瓜", "quantity": "1根", "category": "蔬菜"},
                    {"name": "鸡蛋", "quantity": "2个", "category": "其他"},
                    {"name": "盐", "quantity": "适量", "category": "调味品"},
                    {"name": "香油", "quantity": "几滴", "category": "调味品"},
                ],
            },
            {
                "name": "宫保鸡丁",
                "duration": 25,
                "difficulty": "中等",
                "image_url": "",
                "steps": json.dumps(["鸡胸肉切丁腌制", "花生米炸香", "调酱汁：糖醋生抽淀粉", "滑炒鸡丁盛出", "爆香干辣椒花椒", "下鸡丁花生米翻匀浇汁"]),
                "ingredients": [
                    {"name": "鸡胸肉", "quantity": "300g", "category": "肉类"},
                    {"name": "花生米", "quantity": "50g", "category": "其他"},
                    {"name": "干辣椒", "quantity": "10个", "category": "调味品"},
                    {"name": "花椒", "quantity": "1勺", "category": "调味品"},
                    {"name": "糖", "quantity": "1勺", "category": "调味品"},
                    {"name": "醋", "quantity": "1勺", "category": "调味品"},
                    {"name": "生抽", "quantity": "1勺", "category": "调味品"},
                    {"name": "淀粉", "quantity": "1勺", "category": "调味品"},
                ],
            },
            {
                "name": "麻婆豆腐",
                "duration": 20,
                "difficulty": "中等",
                "image_url": "",
                "steps": json.dumps(["豆腐切块焯水", "猪肉末炒香", "加豆瓣酱炒出红油", "加水放豆腐", "小火烧5分钟勾芡", "撒花椒粉出锅"]),
                "ingredients": [
                    {"name": "豆腐", "quantity": "1块", "category": "其他"},
                    {"name": "猪肉末", "quantity": "100g", "category": "肉类"},
                    {"name": "豆瓣酱", "quantity": "1勺", "category": "调味品"},
                    {"name": "花椒粉", "quantity": "1勺", "category": "调味品"},
                    {"name": "淀粉", "quantity": "1勺", "category": "调味品"},
                    {"name": "生抽", "quantity": "1勺", "category": "调味品"},
                ],
            },
        ]

        for recipe_data in sample_recipes:
            recipe = Recipe(
                name=recipe_data["name"],
                duration=recipe_data["duration"],
                difficulty=recipe_data["difficulty"],
                image_url=recipe_data["image_url"],
                steps=recipe_data["steps"],
            )
            db.add(recipe)
            db.flush()
            for ing in recipe_data["ingredients"]:
                ingredient = Ingredient(
                    recipe_id=recipe.id,
                    name=ing["name"],
                    quantity=ing["quantity"],
                    category=ing["category"],
                )
                db.add(ingredient)
        db.commit()
    db.close()


init_db()


@app.get("/api/recipes", response_model=List[RecipeWithIngredients])
def get_recipes(db: Session = Depends(get_db)):
    recipes = db.query(Recipe).all()
    result = []
    for recipe in recipes:
        ingredients = [
            IngredientIn(name=i.name, quantity=i.quantity, category=i.category)
            for i in recipe.ingredients
        ]
        result.append(
            RecipeWithIngredients(
                id=recipe.id,
                name=recipe.name,
                duration=recipe.duration,
                difficulty=recipe.difficulty,
                image_url=recipe.image_url,
                steps=recipe.steps,
                ingredients=ingredients,
            )
        )
    return result


@app.get("/api/recipes/{recipe_id}", response_model=RecipeWithIngredients)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    ingredients = [
        IngredientIn(name=i.name, quantity=i.quantity, category=i.category)
        for i in recipe.ingredients
    ]
    return RecipeWithIngredients(
        id=recipe.id,
        name=recipe.name,
        duration=recipe.duration,
        difficulty=recipe.difficulty,
        image_url=recipe.image_url,
        steps=recipe.steps,
        ingredients=ingredients,
    )


@app.post("/api/recommend", response_model=List[RecipeWithIngredients])
def recommend_recipes(request: RecommendRequest, db: Session = Depends(get_db)):
    input_ingredients = [ing.strip().lower() for ing in request.ingredients if ing.strip()]
    if not input_ingredients:
        recipes = db.query(Recipe).order_by(Recipe.duration.asc()).limit(10).all()
    else:
        all_recipes = db.query(Recipe).all()
        scored_recipes = []
        for recipe in all_recipes:
            recipe_ing_names = [i.name.lower() for i in recipe.ingredients]
            matched = [
                i.name
                for i in recipe.ingredients
                if any(inp in i.name.lower() or i.name.lower() in inp for inp in input_ingredients)
            ]
            score = len(matched)
            if score > 0:
                scored_recipes.append((recipe, score, matched))
        scored_recipes.sort(key=lambda x: (-x[1], x[0].duration))
        recipes = [r[0] for r in scored_recipes[:10]]

    result = []
    for recipe in recipes:
        matched_list = None
        if input_ingredients:
            matched_list = [
                i.name
                for i in recipe.ingredients
                if any(inp in i.name.lower() or i.name.lower() in inp for inp in input_ingredients)
            ]
        ingredients = [
            IngredientIn(name=i.name, quantity=i.quantity, category=i.category)
            for i in recipe.ingredients
        ]
        result.append(
            RecipeWithIngredients(
                id=recipe.id,
                name=recipe.name,
                duration=recipe.duration,
                difficulty=recipe.difficulty,
                image_url=recipe.image_url,
                steps=recipe.steps,
                ingredients=ingredients,
                matched_ingredients=matched_list,
            )
        )
    return result


@app.post("/api/recipes", response_model=RecipeWithIngredients)
def create_recipe(recipe: RecipeCreate, db: Session = Depends(get_db)):
    db_recipe = Recipe(
        name=recipe.name,
        duration=recipe.duration,
        difficulty=recipe.difficulty,
        image_url=recipe.image_url,
        steps=recipe.steps,
    )
    db.add(db_recipe)
    db.flush()

    for ing in recipe.ingredients:
        db_ingredient = Ingredient(
            recipe_id=db_recipe.id,
            name=ing.name,
            quantity=ing.quantity,
            category=ing.category,
        )
        db.add(db_ingredient)
    db.commit()
    db.refresh(db_recipe)

    ingredients = [
        IngredientIn(name=i.name, quantity=i.quantity, category=i.category)
        for i in db_recipe.ingredients
    ]
    return RecipeWithIngredients(
        id=db_recipe.id,
        name=db_recipe.name,
        duration=db_recipe.duration,
        difficulty=db_recipe.difficulty,
        image_url=db_recipe.image_url,
        steps=db_recipe.steps,
        ingredients=ingredients,
    )


@app.delete("/api/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(recipe)
    db.commit()
    return {"message": "Recipe deleted successfully"}


@app.get("/api/ingredients", response_model=List[IngredientOut])
def get_ingredients(db: Session = Depends(get_db)):
    ingredients = db.query(Ingredient).all()
    return [
        IngredientOut(
            id=i.id,
            name=i.name,
            quantity=i.quantity,
            category=i.category,
        )
        for i in ingredients
    ]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
