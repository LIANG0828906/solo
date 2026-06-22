from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from database import SessionLocal, engine, Base
import models
import schemas
import crud

Base.metadata.create_all(bind=engine)

from sqlalchemy import text
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE recipes ADD COLUMN is_favorite BOOLEAN DEFAULT 0 NOT NULL"))
        conn.commit()
    except Exception:
        pass

app = FastAPI(title="菜谱管理系统 API", description="温馨风格的家庭菜谱管理后端")

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


def recipe_to_response(db_recipe: models.Recipe) -> schemas.Recipe:
    steps_list = json.loads(db_recipe.steps) if db_recipe.steps else []
    ingredients = [
        schemas.Ingredient(
            id=ing.id,
            name=ing.name,
            quantity=ing.quantity,
            unit=ing.unit,
            category=ing.category,
            recipe_id=ing.recipe_id
        )
        for ing in db_recipe.ingredients
    ]
    return schemas.Recipe(
        id=db_recipe.id,
        name=db_recipe.name,
        cooking_time=db_recipe.cooking_time,
        steps=steps_list,
        image_data=db_recipe.image_data,
        created_at=db_recipe.created_at,
        ingredients=ingredients,
        is_favorite=db_recipe.is_favorite
    )


@app.get("/")
def root():
    return {"message": "欢迎使用菜谱管理系统 API", "status": "running"}


@app.get("/api/recipes", response_model=List[schemas.Recipe])
def read_recipes(
    search: Optional[str] = Query(None, description="搜索关键字（菜谱名或食材名）"),
    sort_by: str = Query("created_at", description="排序字段: created_at, name, cooking_time"),
    order: str = Query("desc", description="排序方向: asc, desc"),
    skip: int = 0,
    limit: int = 100,
    is_favorite_only: Optional[bool] = Query(None, description="只显示收藏的菜谱"),
    db: Session = Depends(get_db)
):
    recipes = crud.get_recipes(db, search=search, sort_by=sort_by, order=order, skip=skip, limit=limit, is_favorite_only=is_favorite_only)
    return [recipe_to_response(r) for r in recipes]


@app.patch("/api/recipes/{recipe_id}/favorite", response_model=schemas.Recipe)
def toggle_recipe_favorite(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = crud.toggle_favorite(db, recipe_id=recipe_id)
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="菜谱不存在")
    return recipe_to_response(db_recipe)


@app.get("/api/recipes/{recipe_id}", response_model=schemas.Recipe)
def read_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = crud.get_recipe(db, recipe_id=recipe_id)
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="菜谱不存在")
    return recipe_to_response(db_recipe)


@app.post("/api/recipes", response_model=schemas.Recipe)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    db_recipe = crud.create_recipe(db, recipe=recipe)
    return recipe_to_response(db_recipe)


@app.put("/api/recipes/{recipe_id}", response_model=schemas.Recipe)
def update_recipe(recipe_id: int, recipe_update: schemas.RecipeUpdate, db: Session = Depends(get_db)):
    db_recipe = crud.update_recipe(db, recipe_id=recipe_id, recipe_update=recipe_update)
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="菜谱不存在")
    return recipe_to_response(db_recipe)


@app.delete("/api/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    success = crud.delete_recipe(db, recipe_id=recipe_id)
    if not success:
        raise HTTPException(status_code=404, detail="菜谱不存在")
    return {"message": "删除成功"}


@app.get("/api/inventory", response_model=List[schemas.Inventory])
def read_inventories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    inventories = crud.get_inventories(db, skip=skip, limit=limit)
    return inventories


@app.post("/api/inventory", response_model=schemas.Inventory)
def create_inventory(inventory: schemas.InventoryCreate, db: Session = Depends(get_db)):
    db_inventory = crud.create_inventory(db, inventory=inventory)
    return db_inventory


@app.put("/api/inventory/{inventory_id}", response_model=schemas.Inventory)
def update_inventory(inventory_id: int, inventory_update: schemas.InventoryUpdate, db: Session = Depends(get_db)):
    db_inventory = crud.update_inventory(db, inventory_id=inventory_id, inventory_update=inventory_update)
    if db_inventory is None:
        raise HTTPException(status_code=404, detail="库存不存在")
    return db_inventory


@app.delete("/api/inventory/{inventory_id}")
def delete_inventory(inventory_id: int, db: Session = Depends(get_db)):
    success = crud.delete_inventory(db, inventory_id=inventory_id)
    if not success:
        raise HTTPException(status_code=404, detail="库存不存在")
    return {"message": "删除成功"}


@app.get("/api/ingredients/names", response_model=List[str])
def get_ingredient_names(db: Session = Depends(get_db)):
    names = crud.get_all_ingredient_names(db)
    return names


@app.post("/api/shopping-list/generate")
def generate_shopping_list(request: schemas.ShoppingListGenerateRequest, db: Session = Depends(get_db)):
    shopping_list = crud.generate_shopping_list(db, recipe_ids=request.recipe_ids)
    return {"items": shopping_list, "total_count": len(shopping_list)}


def create_sample_data():
    db = SessionLocal()
    try:
        recipe_count = db.query(models.Recipe).count()
        inventory_count = db.query(models.Inventory).count()

        sample_recipes = [
            {
                "name": "番茄炒蛋",
                "cooking_time": 15,
                "steps": [
                    "番茄洗净切块，鸡蛋打散加少许盐",
                    "热锅冷油，倒入蛋液炒至凝固盛出",
                    "锅中加少许油，放入番茄翻炒出汁",
                    "加入炒好的鸡蛋，加盐和糖调味，翻炒均匀出锅"
                ],
                "ingredients": [
                    {"name": "番茄", "quantity": "2", "unit": "个"},
                    {"name": "鸡蛋", "quantity": "3", "unit": "个"},
                    {"name": "食用油", "quantity": "20", "unit": "毫升"},
                    {"name": "盐", "quantity": "3", "unit": "克"},
                    {"name": "白糖", "quantity": "5", "unit": "克"}
                ]
            },
            {
                "name": "红烧肉",
                "cooking_time": 90,
                "steps": [
                    "五花肉切块，冷水下锅焯水去血沫，捞出沥干",
                    "锅中放少许油，加冰糖小火炒出糖色",
                    "放入肉块翻炒上色，加生抽、老抽、料酒",
                    "加入葱姜、八角、桂皮，加开水没过肉块",
                    "大火烧开转小火炖60分钟，大火收汁即可"
                ],
                "ingredients": [
                    {"name": "五花肉", "quantity": "500", "unit": "克"},
                    {"name": "冰糖", "quantity": "20", "unit": "克"},
                    {"name": "生抽", "quantity": "20", "unit": "毫升"},
                    {"name": "老抽", "quantity": "10", "unit": "毫升"},
                    {"name": "料酒", "quantity": "30", "unit": "毫升"},
                    {"name": "生姜", "quantity": "3", "unit": "片"},
                    {"name": "大葱", "quantity": "1", "unit": "根"},
                    {"name": "八角", "quantity": "2", "unit": "个"},
                    {"name": "桂皮", "quantity": "1", "unit": "小块"}
                ]
            },
            {
                "name": "蒜蓉西兰花",
                "cooking_time": 10,
                "steps": [
                    "西兰花切小朵，淡盐水浸泡10分钟后冲洗干净",
                    "大蒜切末备用",
                    "锅中烧开水，加少许盐和油，西兰花焯水1分钟捞出",
                    "热锅冷油，爆香蒜末",
                    "放入西兰花快速翻炒，加盐调味出锅"
                ],
                "ingredients": [
                    {"name": "西兰花", "quantity": "1", "unit": "颗"},
                    {"name": "大蒜", "quantity": "5", "unit": "瓣"},
                    {"name": "食用油", "quantity": "15", "unit": "毫升"},
                    {"name": "盐", "quantity": "2", "unit": "克"}
                ]
            },
            {
                "name": "清蒸鲈鱼",
                "cooking_time": 20,
                "steps": [
                    "鲈鱼处理干净，两面划几刀，抹少许盐和料酒腌制10分钟",
                    "鱼身铺上姜丝和葱丝",
                    "水开后上锅蒸8-10分钟",
                    "取出倒掉蒸出的汤汁，铺上新葱丝",
                    "淋上蒸鱼豉油，浇上热油即可"
                ],
                "ingredients": [
                    {"name": "鲈鱼", "quantity": "1", "unit": "条"},
                    {"name": "生姜", "quantity": "5", "unit": "片"},
                    {"name": "大葱", "quantity": "1", "unit": "根"},
                    {"name": "料酒", "quantity": "15", "unit": "毫升"},
                    {"name": "蒸鱼豉油", "quantity": "20", "unit": "毫升"},
                    {"name": "食用油", "quantity": "20", "unit": "毫升"},
                    {"name": "盐", "quantity": "2", "unit": "克"}
                ]
            },
            {
                "name": "麻婆豆腐",
                "cooking_time": 20,
                "steps": [
                    "豆腐切块，淡盐水浸泡后焯水捞出备用",
                    "猪肉末加生抽料酒腌制5分钟",
                    "热锅冷油炒香肉末，盛出备用",
                    "锅中加少许油，爆香蒜末姜末，加豆瓣酱炒出红油",
                    "加水烧开，放入豆腐和肉末，小火煮5分钟",
                    "水淀粉勾芡，撒花椒粉和葱花出锅"
                ],
                "ingredients": [
                    {"name": "嫩豆腐", "quantity": "1", "unit": "块"},
                    {"name": "猪肉末", "quantity": "100", "unit": "克"},
                    {"name": "郫县豆瓣酱", "quantity": "15", "unit": "克"},
                    {"name": "大蒜", "quantity": "3", "unit": "瓣"},
                    {"name": "生姜", "quantity": "2", "unit": "片"},
                    {"name": "花椒粉", "quantity": "2", "unit": "克"},
                    {"name": "葱花", "quantity": "适量", "unit": "克"},
                    {"name": "生抽", "quantity": "10", "unit": "毫升"},
                    {"name": "淀粉", "quantity": "5", "unit": "克"},
                    {"name": "食用油", "quantity": "20", "unit": "毫升"}
                ]
            }
        ]

        sample_inventories = [
            {"name": "鸡蛋", "quantity": "10", "unit": "个"},
            {"name": "盐", "quantity": "500", "unit": "克"},
            {"name": "白糖", "quantity": "300", "unit": "克"},
            {"name": "生抽", "quantity": "200", "unit": "毫升"},
            {"name": "食用油", "quantity": "1000", "unit": "毫升"},
            {"name": "番茄", "quantity": "3", "unit": "个"},
            {"name": "土豆", "quantity": "2", "unit": "个"},
            {"name": "胡萝卜", "quantity": "1", "unit": "根"},
            {"name": "大蒜", "quantity": "1", "unit": "头"},
            {"name": "生姜", "quantity": "1", "unit": "块"}
        ]

        if recipe_count == 0:
            for recipe_data in sample_recipes:
                steps_json = json.dumps(recipe_data["steps"], ensure_ascii=False)
                is_favorite = recipe_data["name"] in ["番茄炒蛋", "红烧肉"]
                db_recipe = models.Recipe(
                    name=recipe_data["name"],
                    cooking_time=recipe_data["cooking_time"],
                    steps=steps_json,
                    is_favorite=is_favorite
                )
                db.add(db_recipe)
                db.flush()
                for ing in recipe_data["ingredients"]:
                    category = crud.detect_category(ing["name"])
                    db_ingredient = models.Ingredient(
                        name=ing["name"],
                        quantity=ing["quantity"],
                        unit=ing["unit"],
                        category=category,
                        recipe_id=db_recipe.id
                    )
                    db.add(db_ingredient)

        if inventory_count == 0:
            for inv_data in sample_inventories:
                category = crud.detect_category(inv_data["name"])
                db_inventory = models.Inventory(
                    name=inv_data["name"],
                    quantity=inv_data["quantity"],
                    unit=inv_data["unit"],
                    category=category
                )
                db.add(db_inventory)

        if recipe_count == 0 or inventory_count == 0:
            db.commit()
    finally:
        db.close()


create_sample_data()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
