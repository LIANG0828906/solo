from sqlalchemy.orm import Session
from sqlalchemy import or_, func
import json
import models
import schemas
from typing import List, Optional
from datetime import datetime


VEGETABLE_KEYWORDS = [
    "菜", "瓜", "茄", "葱", "蒜", "姜", "菇", "笋", "萝卜", "白菜", "菠菜",
    "生菜", "芹菜", "韭菜", "洋葱", "番茄", "西红柿", "土豆", "马铃薯", "胡萝卜",
    "黄瓜", "南瓜", "冬瓜", "苦瓜", "茄子", "青椒", "辣椒", "彩椒", "尖椒",
    "香菇", "金针菇", "平菇", "木耳", "海带", "紫菜", "豆芽", "豆腐", "豆皮",
    "西兰花", "花椰菜", "卷心菜", "包菜", "生菜", "油麦菜", "空心菜", "茼蒿",
    "豆角", "豌豆", "毛豆", "玉米", "山药", "莲藕", "红薯", "紫薯"
]

MEAT_KEYWORDS = [
    "猪肉", "牛肉", "羊肉", "鸡肉", "鸭肉", "鱼肉", "虾肉", "蟹肉", "贝肉",
    "猪肝", "猪肚", "猪肠", "牛肚", "羊肚", "鸡肝", "鸭肝",
    "排骨", "里脊", "火腿", "培根", "香肠", "腊肉", "腊肠",
    "五花肉", "瘦肉", "肥肉", "肉馅", "肉末", "鸡丁", "鱼块", "鱼片",
    "猪", "牛", "羊", "鸡", "鸭", "鹅", "鱼", "虾", "蟹", "贝", "肉"
]

SEASONING_KEYWORDS = [
    "盐", "糖", "醋", "酱油", "油", "酱", "料酒", "味精", "鸡精", "胡椒", "花椒",
    "八角", "桂皮", "香叶", "咖喱", "淀粉", "面粉", "生粉", "蚝油", "生抽",
    "老抽", "香油", "麻油", "豆瓣酱", "番茄酱", "芥末", "芝麻", "麻酱",
    "花椒粉", "胡椒粉", "辣椒粉", "孜然", "五香粉", "十三香", "苏打", "发酵粉",
    "辣椒酱", "甜面酱", "芝麻酱", "花生酱", "蜂蜜", "红糖", "冰糖", "白砂糖",
    "蒸鱼豉油", "味极鲜", "香醋", "陈醋", "白醋", "米酒", "黄酒", "白酒"
]

SPECIAL_OTHERS = ["鸡蛋", "鸭蛋", "鹅蛋", "鹌鹑蛋", "皮蛋", "咸蛋"]
SPECIAL_VEGETABLES = ["花椒", "辣椒", "青椒", "红椒"]


def detect_category(name: str) -> str:
    if not name:
        return "其他"
    n = name.strip()
    for w in SPECIAL_OTHERS:
        if w in n:
            return "其他"
    for kw in SEASONING_KEYWORDS:
        if kw in n:
            return "调味料"
    for w in SPECIAL_VEGETABLES:
        if w in n:
            return "蔬菜"
    for kw in MEAT_KEYWORDS:
        if kw in n:
            return "肉类"
    for kw in VEGETABLE_KEYWORDS:
        if kw in n:
            return "蔬菜"
    return "其他"


def get_recipes(
    db: Session,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    skip: int = 0,
    limit: int = 100
):
    query = db.query(models.Recipe)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Recipe.name.like(search_pattern),
                models.Recipe.id.in_(
                    db.query(models.Ingredient.recipe_id)
                    .filter(models.Ingredient.name.like(search_pattern))
                )
            )
        )
    if sort_by == "name":
        order_col = models.Recipe.name
    elif sort_by == "cooking_time":
        order_col = models.Recipe.cooking_time
    else:
        order_col = models.Recipe.created_at
    if order.lower() == "asc":
        query = query.order_by(order_col.asc())
    else:
        query = query.order_by(order_col.desc())
    return query.offset(skip).limit(limit).all()


def get_recipe(db: Session, recipe_id: int):
    return db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()


def create_recipe(db: Session, recipe: schemas.RecipeCreate):
    steps_json = json.dumps(recipe.steps, ensure_ascii=False)
    db_recipe = models.Recipe(
        name=recipe.name,
        cooking_time=recipe.cooking_time,
        steps=steps_json,
        image_data=recipe.image_data
    )
    db.add(db_recipe)
    db.flush()
    for ing in recipe.ingredients:
        category = ing.category if ing.category and ing.category != "其他" else detect_category(ing.name)
        db_ingredient = models.Ingredient(
            name=ing.name,
            quantity=ing.quantity,
            unit=ing.unit,
            category=category,
            recipe_id=db_recipe.id
        )
        db.add(db_ingredient)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


def update_recipe(db: Session, recipe_id: int, recipe_update: schemas.RecipeUpdate):
    db_recipe = get_recipe(db, recipe_id)
    if not db_recipe:
        return None
    update_data = recipe_update.model_dump(exclude_unset=True)
    if "steps" in update_data:
        update_data["steps"] = json.dumps(update_data["steps"], ensure_ascii=False)
    if "ingredients" in update_data:
        ingredients_data = update_data.pop("ingredients")
        db.query(models.Ingredient).filter(models.Ingredient.recipe_id == recipe_id).delete()
        for ing in ingredients_data:
            category = ing.get("category") if ing.get("category") and ing.get("category") != "其他" else detect_category(ing.get("name", ""))
            db_ingredient = models.Ingredient(
                name=ing.get("name"),
                quantity=ing.get("quantity"),
                unit=ing.get("unit"),
                category=category,
                recipe_id=recipe_id
            )
            db.add(db_ingredient)
    for key, value in update_data.items():
        setattr(db_recipe, key, value)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


def delete_recipe(db: Session, recipe_id: int):
    db_recipe = get_recipe(db, recipe_id)
    if not db_recipe:
        return False
    db.delete(db_recipe)
    db.commit()
    return True


def get_ingredients_by_recipe(db: Session, recipe_id: int):
    return db.query(models.Ingredient).filter(models.Ingredient.recipe_id == recipe_id).all()


def create_ingredient(db: Session, ingredient: schemas.IngredientCreate, recipe_id: int):
    category = ingredient.category if ingredient.category and ingredient.category != "其他" else detect_category(ingredient.name)
    db_ingredient = models.Ingredient(
        name=ingredient.name,
        quantity=ingredient.quantity,
        unit=ingredient.unit,
        category=category,
        recipe_id=recipe_id
    )
    db.add(db_ingredient)
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient


def get_all_ingredient_names(db: Session):
    results = db.query(models.Ingredient.name).distinct().all()
    results += db.query(models.Inventory.name).distinct().all()
    names = sorted(set(r[0] for r in results if r[0]))
    return names


def get_inventories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Inventory).order_by(models.Inventory.last_updated.desc()).offset(skip).limit(limit).all()


def get_inventory(db: Session, inventory_id: int):
    return db.query(models.Inventory).filter(models.Inventory.id == inventory_id).first()


def get_inventory_by_name(db: Session, name: str):
    return db.query(models.Inventory).filter(func.lower(models.Inventory.name) == func.lower(name)).first()


def create_inventory(db: Session, inventory: schemas.InventoryCreate):
    category = inventory.category if inventory.category and inventory.category != "其他" else detect_category(inventory.name)
    db_inventory = models.Inventory(
        name=inventory.name,
        quantity=inventory.quantity,
        unit=inventory.unit,
        category=category
    )
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory


def update_inventory(db: Session, inventory_id: int, inventory_update: schemas.InventoryUpdate):
    db_inventory = get_inventory(db, inventory_id)
    if not db_inventory:
        return None
    update_data = inventory_update.model_dump(exclude_unset=True)
    if "name" in update_data and ("category" not in update_data or update_data["category"] == "其他"):
        update_data["category"] = detect_category(update_data["name"])
    update_data["last_updated"] = datetime.utcnow()
    for key, value in update_data.items():
        setattr(db_inventory, key, value)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory


def delete_inventory(db: Session, inventory_id: int):
    db_inventory = get_inventory(db, inventory_id)
    if not db_inventory:
        return False
    db.delete(db_inventory)
    db.commit()
    return True


def parse_quantity(quantity_str: str) -> Optional[float]:
    try:
        return float(quantity_str)
    except (ValueError, TypeError):
        return None


def generate_shopping_list(db: Session, recipe_ids: List[int]):
    ingredient_map = {}
    for rid in recipe_ids:
        recipe = get_recipe(db, rid)
        if not recipe:
            continue
        for ing in recipe.ingredients:
            key = (ing.name.lower(), ing.unit)
            inventory = get_inventory_by_name(db, ing.name)
            need_qty = parse_quantity(ing.quantity)
            if inventory:
                inv_qty = parse_quantity(inventory.quantity)
                if need_qty is not None and inv_qty is not None and inv_qty >= need_qty:
                    continue
                elif need_qty is not None and inv_qty is not None:
                    remaining = round(need_qty - inv_qty, 2)
                    if remaining <= 0:
                        continue
                    qty_val = str(remaining)
                else:
                    qty_val = ing.quantity
            else:
                qty_val = ing.quantity
            if key in ingredient_map:
                existing = ingredient_map[key]
                exist_qty = parse_quantity(existing["quantity"])
                new_qty = parse_quantity(qty_val)
                if exist_qty is not None and new_qty is not None:
                    existing["quantity"] = str(round(exist_qty + new_qty, 2))
                else:
                    existing["quantity"] = f"{existing['quantity']} + {qty_val}"
            else:
                category = ing.category if ing.category and ing.category != "其他" else detect_category(ing.name)
                ingredient_map[key] = {
                    "name": ing.name,
                    "quantity": qty_val,
                    "unit": ing.unit,
                    "category": category
                }
    shopping_list = []
    for idx, item in enumerate(ingredient_map.values(), 1):
        shopping_list.append({
            "id": idx,
            "name": item["name"],
            "quantity": item["quantity"],
            "unit": item["unit"],
            "category": item["category"],
            "is_checked": False
        })
    return shopping_list
