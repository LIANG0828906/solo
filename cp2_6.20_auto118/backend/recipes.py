from dataclasses import dataclass, field
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional
import uuid
import copy


@dataclass
class Ingredient:
    id: str
    name: str
    amount: float
    unit: str
    caloriesPer100g: float
    proteinPer100g: float
    fatPer100g: float
    carbsPer100g: float


@dataclass
class RecipeIngredient:
    ingredientId: str
    name: str
    amount: float
    unit: str


@dataclass
class Nutrition:
    calories: float
    protein: float
    fat: float
    carbs: float


@dataclass
class Recipe:
    id: str
    title: str
    imageUrl: str
    cookTime: int
    difficulty: str
    cuisine: str
    steps: List[str]
    ingredients: List[RecipeIngredient]
    nutrition: Nutrition
    isFavorite: bool = False
    rating: float = 0.0
    createdAt: datetime = field(default_factory=datetime.now)


@dataclass
class MealPlan:
    id: str
    date: str
    mealType: str
    recipeId: str


@dataclass
class DailyGoal:
    calories: float = 2000.0
    protein: float = 60.0
    fat: float = 65.0
    carbs: float = 250.0


INGREDIENTS_DB: Dict[str, Dict] = {
    "rice": {"name": "米饭", "caloriesPer100g": 116, "proteinPer100g": 2.6, "fatPer100g": 0.3, "carbsPer100g": 25.9, "unit": "g"},
    "chicken_breast": {"name": "鸡胸肉", "caloriesPer100g": 165, "proteinPer100g": 31.0, "fatPer100g": 3.6, "carbsPer100g": 0.0, "unit": "g"},
    "egg": {"name": "鸡蛋", "caloriesPer100g": 155, "proteinPer100g": 13.0, "fatPer100g": 11.0, "carbsPer100g": 1.1, "unit": "个"},
    "broccoli": {"name": "西兰花", "caloriesPer100g": 34, "proteinPer100g": 2.8, "fatPer100g": 0.4, "carbsPer100g": 6.6, "unit": "g"},
    "beef": {"name": "牛肉", "caloriesPer100g": 250, "proteinPer100g": 26.0, "fatPer100g": 15.0, "carbsPer100g": 0.0, "unit": "g"},
    "pork": {"name": "猪肉", "caloriesPer100g": 242, "proteinPer100g": 27.0, "fatPer100g": 14.0, "carbsPer100g": 0.0, "unit": "g"},
    "salmon": {"name": "三文鱼", "caloriesPer100g": 208, "proteinPer100g": 20.0, "fatPer100g": 13.0, "carbsPer100g": 0.0, "unit": "g"},
    "tofu": {"name": "豆腐", "caloriesPer100g": 76, "proteinPer100g": 8.0, "fatPer100g": 4.8, "carbsPer100g": 1.9, "unit": "g"},
    "milk": {"name": "牛奶", "caloriesPer100g": 42, "proteinPer100g": 3.4, "fatPer100g": 1.0, "carbsPer100g": 5.0, "unit": "ml"},
    "yogurt": {"name": "酸奶", "caloriesPer100g": 59, "proteinPer100g": 10.0, "fatPer100g": 0.7, "carbsPer100g": 3.6, "unit": "g"},
    "oats": {"name": "燕麦", "caloriesPer100g": 389, "proteinPer100g": 16.9, "fatPer100g": 6.9, "carbsPer100g": 66.3, "unit": "g"},
    "bread": {"name": "面包", "caloriesPer100g": 265, "proteinPer100g": 9.0, "fatPer100g": 3.2, "carbsPer100g": 49.0, "unit": "片"},
    "noodles": {"name": "面条", "caloriesPer100g": 138, "proteinPer100g": 4.5, "fatPer100g": 0.7, "carbsPer100g": 28.0, "unit": "g"},
    "potato": {"name": "土豆", "caloriesPer100g": 77, "proteinPer100g": 2.0, "fatPer100g": 0.1, "carbsPer100g": 17.0, "unit": "g"},
    "tomato": {"name": "番茄", "caloriesPer100g": 18, "proteinPer100g": 0.9, "fatPer100g": 0.2, "carbsPer100g": 3.9, "unit": "g"},
    "carrot": {"name": "胡萝卜", "caloriesPer100g": 41, "proteinPer100g": 0.9, "fatPer100g": 0.2, "carbsPer100g": 9.6, "unit": "g"},
    "onion": {"name": "洋葱", "caloriesPer100g": 40, "proteinPer100g": 1.1, "fatPer100g": 0.1, "carbsPer100g": 9.3, "unit": "g"},
    "spinach": {"name": "菠菜", "caloriesPer100g": 23, "proteinPer100g": 2.9, "fatPer100g": 0.4, "carbsPer100g": 3.6, "unit": "g"},
    "lettuce": {"name": "生菜", "caloriesPer100g": 15, "proteinPer100g": 1.4, "fatPer100g": 0.2, "carbsPer100g": 2.9, "unit": "g"},
    "cucumber": {"name": "黄瓜", "caloriesPer100g": 16, "proteinPer100g": 0.7, "fatPer100g": 0.1, "carbsPer100g": 3.6, "unit": "g"},
    "apple": {"name": "苹果", "caloriesPer100g": 52, "proteinPer100g": 0.3, "fatPer100g": 0.2, "carbsPer100g": 14.0, "unit": "个"},
    "banana": {"name": "香蕉", "caloriesPer100g": 89, "proteinPer100g": 1.1, "fatPer100g": 0.3, "carbsPer100g": 23.0, "unit": "根"},
    "orange": {"name": "橙子", "caloriesPer100g": 47, "proteinPer100g": 0.9, "fatPer100g": 0.1, "carbsPer100g": 12.0, "unit": "个"},
    "grape": {"name": "葡萄", "caloriesPer100g": 69, "proteinPer100g": 0.6, "fatPer100g": 0.2, "carbsPer100g": 18.0, "unit": "g"},
    "strawberry": {"name": "草莓", "caloriesPer100g": 32, "proteinPer100g": 0.7, "fatPer100g": 0.3, "carbsPer100g": 7.7, "unit": "g"},
    "blueberry": {"name": "蓝莓", "caloriesPer100g": 57, "proteinPer100g": 0.7, "fatPer100g": 0.3, "carbsPer100g": 14.0, "unit": "g"},
    "olive_oil": {"name": "橄榄油", "caloriesPer100g": 884, "proteinPer100g": 0.0, "fatPer100g": 100.0, "carbsPer100g": 0.0, "unit": "ml"},
    "butter": {"name": "黄油", "caloriesPer100g": 717, "proteinPer100g": 0.9, "fatPer100g": 81.0, "carbsPer100g": 0.1, "unit": "g"},
    "cheese": {"name": "奶酪", "caloriesPer100g": 402, "proteinPer100g": 25.0, "fatPer100g": 33.0, "carbsPer100g": 1.3, "unit": "g"},
    "peanut_butter": {"name": "花生酱", "caloriesPer100g": 594, "proteinPer100g": 25.0, "fatPer100g": 50.0, "carbsPer100g": 20.0, "unit": "g"},
}


UNIT_CONVERSIONS = {
    "g": {"factor": 1.0, "category": "weight", "label": "克"},
    "克": {"factor": 1.0, "category": "weight", "label": "克"},
    "ml": {"factor": 1.0, "category": "volume", "label": "毫升"},
    "毫升": {"factor": 1.0, "category": "volume", "label": "毫升"},
    "个": {"factor": 50.0, "category": "piece", "label": "个"},
    "只": {"factor": 50.0, "category": "piece", "label": "只"},
    "片": {"factor": 30.0, "category": "piece", "label": "片"},
    "根": {"factor": 120.0, "category": "piece", "label": "根"},
    "勺": {"factor": 15.0, "category": "volume", "label": "勺"},
    "汤匙": {"factor": 15.0, "category": "volume", "label": "汤匙"},
    "茶匙": {"factor": 5.0, "category": "volume", "label": "茶匙"},
    "杯": {"factor": 240.0, "category": "volume", "label": "杯"},
    "小碗": {"factor": 150.0, "category": "volume", "label": "小碗"},
    "大碗": {"factor": 300.0, "category": "volume", "label": "大碗"},
    "块": {"factor": 30.0, "category": "piece", "label": "块"},
    "条": {"factor": 25.0, "category": "piece", "label": "条"},
}

DEFAULT_UNIT_FACTOR = 1.0
DEFAULT_UNIT_CATEGORY = "weight"


def get_unit_factor(unit: str) -> float:
    if not unit:
        return DEFAULT_UNIT_FACTOR
    
    unit_info = UNIT_CONVERSIONS.get(unit)
    if unit_info:
        return unit_info["factor"]
    
    lower_unit = unit.lower().strip()
    for key, info in UNIT_CONVERSIONS.items():
        if key.lower() == lower_unit:
            return info["factor"]
    
    return DEFAULT_UNIT_FACTOR


def register_unit(unit: str, factor: float, category: str = "custom", label: str = "") -> None:
    UNIT_CONVERSIONS[unit] = {
        "factor": factor,
        "category": category,
        "label": label or unit,
    }


recipes: List[Recipe] = []
meal_plans: List[MealPlan] = []
daily_goal = DailyGoal()


def _generate_id() -> str:
    return str(uuid.uuid4())


def get_recipes(cuisine: Optional[str] = None, cookTime: Optional[int] = None, difficulty: Optional[str] = None, favorite: Optional[bool] = None) -> List[Recipe]:
    result = recipes
    if cuisine:
        result = [r for r in result if r.cuisine == cuisine]
    if cookTime:
        result = [r for r in result if r.cookTime <= cookTime]
    if difficulty:
        result = [r for r in result if r.difficulty == difficulty]
    if favorite is not None:
        result = [r for r in result if r.isFavorite == favorite]
    return result


def get_recipe(recipe_id: str) -> Optional[Recipe]:
    for r in recipes:
        if r.id == recipe_id:
            return r
    return None


def create_recipe(data: dict) -> Recipe:
    recipe_ingredients = []
    for ing in data.get("ingredients", []):
        recipe_ingredients.append(RecipeIngredient(
            ingredientId=ing.get("ingredientId", ""),
            name=ing.get("name", ""),
            amount=ing.get("amount", 0),
            unit=ing.get("unit", "g")
        ))
    
    nutrition_data = data.get("nutrition")
    if not nutrition_data:
        nutrition_data = calculate_nutrition(recipe_ingredients)
    
    nutrition = Nutrition(
        calories=nutrition_data.get("calories", 0),
        protein=nutrition_data.get("protein", 0),
        fat=nutrition_data.get("fat", 0),
        carbs=nutrition_data.get("carbs", 0)
    )
    
    recipe = Recipe(
        id=_generate_id(),
        title=data["title"],
        imageUrl=data.get("imageUrl", ""),
        cookTime=data["cookTime"],
        difficulty=data["difficulty"],
        cuisine=data["cuisine"],
        steps=data.get("steps", []),
        ingredients=recipe_ingredients,
        nutrition=nutrition,
        isFavorite=data.get("isFavorite", False),
        rating=data.get("rating", 0.0),
        createdAt=datetime.now()
    )
    recipes.append(recipe)
    return recipe


def update_recipe(recipe_id: str, data: dict) -> Optional[Recipe]:
    recipe = get_recipe(recipe_id)
    if not recipe:
        return None
    
    if "title" in data:
        recipe.title = data["title"]
    if "imageUrl" in data:
        recipe.imageUrl = data["imageUrl"]
    if "cookTime" in data:
        recipe.cookTime = data["cookTime"]
    if "difficulty" in data:
        recipe.difficulty = data["difficulty"]
    if "cuisine" in data:
        recipe.cuisine = data["cuisine"]
    if "steps" in data:
        recipe.steps = data["steps"]
    if "ingredients" in data:
        recipe_ingredients = []
        for ing in data["ingredients"]:
            recipe_ingredients.append(RecipeIngredient(
                ingredientId=ing.get("ingredientId", ""),
                name=ing.get("name", ""),
                amount=ing.get("amount", 0),
                unit=ing.get("unit", "g")
            ))
        recipe.ingredients = recipe_ingredients
        recipe.nutrition = Nutrition(**calculate_nutrition(recipe_ingredients))
    if "nutrition" in data:
        n = data["nutrition"]
        recipe.nutrition = Nutrition(
            calories=n.get("calories", recipe.nutrition.calories),
            protein=n.get("protein", recipe.nutrition.protein),
            fat=n.get("fat", recipe.nutrition.fat),
            carbs=n.get("carbs", recipe.nutrition.carbs)
        )
    if "isFavorite" in data:
        recipe.isFavorite = data["isFavorite"]
    if "rating" in data:
        recipe.rating = data["rating"]
    
    return recipe


def delete_recipe(recipe_id: str) -> bool:
    for i, r in enumerate(recipes):
        if r.id == recipe_id:
            recipes.pop(i)
            return True
    return False


def toggle_favorite(recipe_id: str) -> Optional[Recipe]:
    recipe = get_recipe(recipe_id)
    if recipe:
        recipe.isFavorite = not recipe.isFavorite
        return recipe
    return None


def search_ingredients(keyword: str) -> List[dict]:
    keyword = keyword.lower()
    results = []
    for ing_id, ing_data in INGREDIENTS_DB.items():
        if keyword in ing_data["name"].lower() or keyword in ing_id.lower():
            results.append({"id": ing_id, **ing_data})
    return results


def calculate_nutrition(ingredients: List[RecipeIngredient]) -> Dict[str, float]:
    total_calories = 0.0
    total_protein = 0.0
    total_fat = 0.0
    total_carbs = 0.0
    processed_count = 0
    skipped_ingredients = []
    
    for ing in ingredients:
        try:
            ing_data = None
            
            if ing.ingredientId and ing.ingredientId in INGREDIENTS_DB:
                ing_data = INGREDIENTS_DB[ing.ingredientId]
            
            if not ing_data:
                for db_ing in INGREDIENTS_DB.values():
                    if db_ing["name"] == ing.name:
                        ing_data = db_ing
                        break
            
            if not ing_data:
                skipped_ingredients.append(ing.name)
                continue
            
            unit_factor = get_unit_factor(ing.unit)
            if unit_factor <= 0:
                unit_factor = DEFAULT_UNIT_FACTOR
            
            amount = float(ing.amount) if ing.amount else 0.0
            if amount <= 0:
                continue
            
            weight_grams = amount * unit_factor
            factor = weight_grams / 100.0
            
            total_calories += float(ing_data.get("caloriesPer100g", 0)) * factor
            total_protein += float(ing_data.get("proteinPer100g", 0)) * factor
            total_fat += float(ing_data.get("fatPer100g", 0)) * factor
            total_carbs += float(ing_data.get("carbsPer100g", 0)) * factor
            
            processed_count += 1
            
        except (ValueError, TypeError, KeyError) as e:
            skipped_ingredients.append(f"{ing.name} (error: {str(e)})")
            continue
    
    return {
        "calories": round(max(total_calories, 0), 1),
        "protein": round(max(total_protein, 0), 1),
        "fat": round(max(total_fat, 0), 1),
        "carbs": round(max(total_carbs, 0), 1),
        "processedCount": processed_count,
        "skippedIngredients": skipped_ingredients,
    }


def _parse_date(date_str: str) -> date:
    return datetime.strptime(date_str, "%Y-%m-%d").date()


def get_meal_plans_by_week(start_date: str) -> Dict[str, List[MealPlan]]:
    start = _parse_date(start_date)
    result = {}
    for i in range(7):
        day = start + timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        result[day_str] = []
    
    for mp in meal_plans:
        mp_date = _parse_date(mp.date)
        if start <= mp_date < start + timedelta(days=7):
            if mp.date in result:
                result[mp.date].append(mp)
    
    return result


def add_meal_plan(data: dict) -> MealPlan:
    mp = MealPlan(
        id=_generate_id(),
        date=data["date"],
        mealType=data["mealType"],
        recipeId=data["recipeId"]
    )
    meal_plans.append(mp)
    return mp


def remove_meal_plan(meal_plan_id: str) -> bool:
    for i, mp in enumerate(meal_plans):
        if mp.id == meal_plan_id:
            meal_plans.pop(i)
            return True
    return False


def calculate_daily_summary(target_date: str) -> Dict[str, float]:
    day_plans = [mp for mp in meal_plans if mp.date == target_date]
    total_calories = 0.0
    total_protein = 0.0
    total_fat = 0.0
    total_carbs = 0.0
    meal_count = 0
    
    for mp in day_plans:
        recipe = get_recipe(mp.recipeId)
        if recipe:
            total_calories += recipe.nutrition.calories
            total_protein += recipe.nutrition.protein
            total_fat += recipe.nutrition.fat
            total_carbs += recipe.nutrition.carbs
            meal_count += 1
    
    return {
        "date": target_date,
        "meals": meal_count,
        "calories": round(total_calories, 1),
        "protein": round(total_protein, 1),
        "fat": round(total_fat, 1),
        "carbs": round(total_carbs, 1),
        "goal": {
            "calories": daily_goal.calories,
            "protein": daily_goal.protein,
            "fat": daily_goal.fat,
            "carbs": daily_goal.carbs
        }
    }
