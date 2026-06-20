from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import json

from recipes import (
    Recipe, RecipeIngredient, MealPlan, DailyGoal,
    recipes, meal_plans, daily_goal,
    get_recipes, get_recipe, create_recipe, update_recipe, delete_recipe, toggle_favorite,
    search_ingredients, calculate_nutrition,
    get_meal_plans_by_week, add_meal_plan, remove_meal_plan,
    calculate_daily_summary
)


app = FastAPI(title="食谱营养管理API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass


manager = ConnectionManager()


class RecipeIngredientRequest(BaseModel):
    ingredientId: Optional[str] = ""
    name: str
    amount: float
    unit: str = "g"


class NutritionRequest(BaseModel):
    calories: Optional[float] = 0
    protein: Optional[float] = 0
    fat: Optional[float] = 0
    carbs: Optional[float] = 0


class CreateRecipeRequest(BaseModel):
    title: str
    imageUrl: Optional[str] = ""
    cookTime: int
    difficulty: str
    cuisine: str
    steps: Optional[List[str]] = []
    ingredients: List[RecipeIngredientRequest]
    nutrition: Optional[NutritionRequest] = None
    isFavorite: Optional[bool] = False
    rating: Optional[float] = 0.0


class UpdateRecipeRequest(BaseModel):
    title: Optional[str] = None
    imageUrl: Optional[str] = None
    cookTime: Optional[int] = None
    difficulty: Optional[str] = None
    cuisine: Optional[str] = None
    steps: Optional[List[str]] = None
    ingredients: Optional[List[RecipeIngredientRequest]] = None
    nutrition: Optional[NutritionRequest] = None
    isFavorite: Optional[bool] = None
    rating: Optional[float] = None


class CalculateNutritionRequest(BaseModel):
    ingredients: List[RecipeIngredientRequest]


class MealPlanRequest(BaseModel):
    date: str
    mealType: str
    recipeId: str


class DailyGoalRequest(BaseModel):
    calories: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbs: Optional[float] = None


def recipe_to_dict(r: Recipe) -> Dict[str, Any]:
    return {
        "id": r.id,
        "title": r.title,
        "imageUrl": r.imageUrl,
        "cookTime": r.cookTime,
        "difficulty": r.difficulty,
        "cuisine": r.cuisine,
        "steps": r.steps,
        "ingredients": [
            {
                "ingredientId": ing.ingredientId,
                "name": ing.name,
                "amount": ing.amount,
                "unit": ing.unit
            }
            for ing in r.ingredients
        ],
        "nutrition": {
            "calories": r.nutrition.calories,
            "protein": r.nutrition.protein,
            "fat": r.nutrition.fat,
            "carbs": r.nutrition.carbs
        },
        "isFavorite": r.isFavorite,
        "rating": r.rating,
        "createdAt": r.createdAt.isoformat() if isinstance(r.createdAt, datetime) else str(r.createdAt)
    }


def meal_plan_to_dict(mp: MealPlan) -> Dict[str, Any]:
    return {
        "id": mp.id,
        "date": mp.date,
        "mealType": mp.mealType,
        "recipeId": mp.recipeId
    }


def _notify_summary_change(target_date: Optional[str] = None):
    if target_date is None:
        target_date = date.today().strftime("%Y-%m-%d")
    summary = calculate_daily_summary(target_date)
    summary["date"] = target_date
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(manager.broadcast({
                "type": "daily_summary",
                "data": summary
            }))
        else:
            import threading
            def _broadcast_in_thread():
                try:
                    new_loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(new_loop)
                    new_loop.run_until_complete(manager.broadcast({
                        "type": "daily_summary",
                        "data": summary
                    }))
                    new_loop.close()
                except Exception:
                    pass
            thread = threading.Thread(target=_broadcast_in_thread, daemon=True)
            thread.start()
    except Exception:
        pass


@app.get("/ingredients")
def get_ingredients(search: Optional[str] = Query("")):
    return search_ingredients(search)


@app.get("/recipes")
def list_recipes(
    cuisine: Optional[str] = None,
    cookTime: Optional[int] = None,
    difficulty: Optional[str] = None,
    favorite: Optional[bool] = None
):
    result = get_recipes(cuisine=cuisine, cookTime=cookTime, difficulty=difficulty, favorite=favorite)
    return [recipe_to_dict(r) for r in result]


@app.get("/recipes/{recipe_id}")
def get_single_recipe(recipe_id: str):
    recipe = get_recipe(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="食谱不存在")
    return recipe_to_dict(recipe)


@app.post("/recipes")
def create_new_recipe(req: CreateRecipeRequest):
    data = req.dict()
    recipe = create_recipe(data)
    return recipe_to_dict(recipe)


@app.put("/recipes/{recipe_id}")
def update_existing_recipe(recipe_id: str, req: UpdateRecipeRequest):
    data = {k: v for k, v in req.dict().items() if v is not None}
    recipe = update_recipe(recipe_id, data)
    if not recipe:
        raise HTTPException(status_code=404, detail="食谱不存在")
    
    today_str = date.today().strftime("%Y-%m-%d")
    affected_dates = set()
    for mp in meal_plans:
        if mp.recipeId == recipe_id:
            affected_dates.add(mp.date)
    
    for d in affected_dates:
        _notify_summary_change(d)
    
    return recipe_to_dict(recipe)


@app.delete("/recipes/{recipe_id}")
def delete_existing_recipe(recipe_id: str):
    affected_dates = set()
    for mp in meal_plans:
        if mp.recipeId == recipe_id:
            affected_dates.add(mp.date)
    
    if not delete_recipe(recipe_id):
        raise HTTPException(status_code=404, detail="食谱不存在")
    
    for d in affected_dates:
        _notify_summary_change(d)
    
    return {"success": True}


@app.post("/recipes/{recipe_id}/toggle-favorite")
def toggle_recipe_favorite(recipe_id: str):
    recipe = toggle_favorite(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="食谱不存在")
    return recipe_to_dict(recipe)


@app.post("/nutrition/calculate")
def calc_nutrition(req: CalculateNutritionRequest):
    ingredients = [
        RecipeIngredient(
            ingredientId=ing.ingredientId,
            name=ing.name,
            amount=ing.amount,
            unit=ing.unit
        )
        for ing in req.ingredients
    ]
    return calculate_nutrition(ingredients)


@app.get("/meal-plans")
def get_weekly_meal_plans(weekStart: Optional[str] = None):
    if not weekStart:
        weekStart = date.today().strftime("%Y-%m-%d")
    plans = get_meal_plans_by_week(weekStart)
    result = {}
    for day_str, day_plans in plans.items():
        result[day_str] = [meal_plan_to_dict(mp) for mp in day_plans]
    return result


@app.post("/meal-plans")
def create_meal_plan(req: MealPlanRequest):
    mp = add_meal_plan(req.dict())
    _notify_summary_change(req.date)
    return meal_plan_to_dict(mp)


@app.delete("/meal-plans/{meal_plan_id}")
def delete_meal_plan(meal_plan_id: str):
    target_mp = next((mp for mp in meal_plans if mp.id == meal_plan_id), None)
    target_date = target_mp.date if target_mp else None
    
    if not remove_meal_plan(meal_plan_id):
        raise HTTPException(status_code=404, detail="餐食计划不存在")
    
    if target_date:
        _notify_summary_change(target_date)
    
    return {"success": True}


@app.get("/daily-goal")
def get_daily_goal():
    return {
        "calories": daily_goal.calories,
        "protein": daily_goal.protein,
        "fat": daily_goal.fat,
        "carbs": daily_goal.carbs
    }


@app.put("/daily-goal")
def update_daily_goal(req: DailyGoalRequest):
    if req.calories is not None:
        daily_goal.calories = req.calories
    if req.protein is not None:
        daily_goal.protein = req.protein
    if req.fat is not None:
        daily_goal.fat = req.fat
    if req.carbs is not None:
        daily_goal.carbs = req.carbs
    
    today_str = date.today().strftime("%Y-%m-%d")
    _notify_summary_change(today_str)
    
    return get_daily_goal()


@app.get("/daily-summary")
def get_daily_summary(date: Optional[str] = None):
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    return calculate_daily_summary(date)


@app.websocket("/ws/daily-summary")
async def websocket_daily_summary(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        today_str = datetime.now().strftime("%Y-%m-%d")
        summary = calculate_daily_summary(today_str)
        await websocket.send_json({
            "type": "daily_summary",
            "data": summary
        })
        
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


def init_sample_data():
    sample_recipes = [
        {
            "title": "香煎鸡胸肉配西兰花",
            "imageUrl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
            "cookTime": 30,
            "difficulty": "简单",
            "cuisine": "西式",
            "steps": [
                "鸡胸肉用盐、黑胡椒和少许橄榄油腌制15分钟",
                "西兰花切小朵，焯水备用",
                "平底锅加热，放入鸡胸肉煎至两面金黄",
                "加入西兰花翻炒均匀，出锅装盘"
            ],
            "ingredients": [
                {"ingredientId": "chicken_breast", "name": "鸡胸肉", "amount": 200, "unit": "g"},
                {"ingredientId": "broccoli", "name": "西兰花", "amount": 150, "unit": "g"},
                {"ingredientId": "olive_oil", "name": "橄榄油", "amount": 10, "unit": "ml"}
            ],
            "isFavorite": True,
            "rating": 4.5
        },
        {
            "title": "番茄牛肉面",
            "imageUrl": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
            "cookTime": 45,
            "difficulty": "中等",
            "cuisine": "中式",
            "steps": [
                "牛肉切块焯水去血沫",
                "番茄切块，洋葱切丁",
                "锅中加油，炒香洋葱，加入番茄炒出汁",
                "加入牛肉和适量水，炖煮30分钟",
                "另起锅煮面条，捞出浇上番茄牛肉汤"
            ],
            "ingredients": [
                {"ingredientId": "beef", "name": "牛肉", "amount": 150, "unit": "g"},
                {"ingredientId": "tomato", "name": "番茄", "amount": 200, "unit": "g"},
                {"ingredientId": "noodles", "name": "面条", "amount": 100, "unit": "g"},
                {"ingredientId": "onion", "name": "洋葱", "amount": 50, "unit": "g"}
            ],
            "isFavorite": False,
            "rating": 4.8
        },
        {
            "title": "燕麦牛奶早餐碗",
            "imageUrl": "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=800",
            "cookTime": 10,
            "difficulty": "简单",
            "cuisine": "西式",
            "steps": [
                "燕麦片中加入热牛奶，静置3分钟",
                "香蕉切片，蓝莓洗净",
                "将水果摆放在燕麦上",
                "淋上少许蜂蜜即可"
            ],
            "ingredients": [
                {"ingredientId": "oats", "name": "燕麦", "amount": 50, "unit": "g"},
                {"ingredientId": "milk", "name": "牛奶", "amount": 200, "unit": "ml"},
                {"ingredientId": "banana", "name": "香蕉", "amount": 1, "unit": "根"},
                {"ingredientId": "blueberry", "name": "蓝莓", "amount": 30, "unit": "g"}
            ],
            "isFavorite": True,
            "rating": 4.2
        },
        {
            "title": "三文鱼豆腐汤",
            "imageUrl": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
            "cookTime": 25,
            "difficulty": "简单",
            "cuisine": "日式",
            "steps": [
                "三文鱼切块，用盐和料酒腌制10分钟",
                "豆腐切块，胡萝卜切片",
                "锅中加水煮沸，放入胡萝卜煮5分钟",
                "加入三文鱼和豆腐，煮至鱼肉熟透",
                "加盐和少许白胡椒粉调味"
            ],
            "ingredients": [
                {"ingredientId": "salmon", "name": "三文鱼", "amount": 150, "unit": "g"},
                {"ingredientId": "tofu", "name": "豆腐", "amount": 100, "unit": "g"},
                {"ingredientId": "carrot", "name": "胡萝卜", "amount": 50, "unit": "g"}
            ],
            "isFavorite": False,
            "rating": 4.6
        },
        {
            "title": "菠菜鸡蛋三明治",
            "imageUrl": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800",
            "cookTime": 15,
            "difficulty": "简单",
            "cuisine": "西式",
            "steps": [
                "面包片放入烤箱烤至金黄",
                "菠菜焯水后挤干水分",
                "鸡蛋打散煎成蛋饼",
                "将菠菜、蛋饼夹在两片面包中，对角切开"
            ],
            "ingredients": [
                {"ingredientId": "bread", "name": "面包", "amount": 2, "unit": "片"},
                {"ingredientId": "egg", "name": "鸡蛋", "amount": 2, "unit": "个"},
                {"ingredientId": "spinach", "name": "菠菜", "amount": 50, "unit": "g"}
            ],
            "isFavorite": True,
            "rating": 4.0
        }
    ]
    
    for r in sample_recipes:
        create_recipe(r)


@app.on_event("startup")
async def startup_event():
    init_sample_data()
