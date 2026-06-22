from contextlib import asynccontextmanager
from datetime import datetime
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import select

from backend.database import Base, engine, AsyncSessionLocal
from backend.models import User, Recipe, Ingredient, Comment, MealPlanEntry, ShoppingListChecked
from backend.routers import recipes, meal_plans, shopping_list
from backend.socket_manager import socket_manager


DEFAULT_USER_ID = "user-demo-001"
DEFAULT_ROOM_ID = "demo-room-001"


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def seed_initial_data():
    async with AsyncSessionLocal() as db:
        user_result = await db.execute(select(User).where(User.id == DEFAULT_USER_ID))
        user = user_result.scalar_one_or_none()
        if not user:
            user = User(
                id=DEFAULT_USER_ID,
                nickname="美食达人小王",
                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=xiaowang",
                room_id=DEFAULT_ROOM_ID,
            )
            db.add(user)

        user2_id = "user-demo-002"
        user2_result = await db.execute(select(User).where(User.id == user2_id))
        if not user2_result.scalar_one_or_none():
            user2 = User(
                id=user2_id,
                nickname="厨房新手小李",
                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoli",
                room_id=DEFAULT_ROOM_ID,
            )
            db.add(user2)

        sample_recipes = [
            {
                "id": "recipe-tomato-egg",
                "name": "番茄炒蛋",
                "thumbnail": None,
                "hero_image": None,
                "cook_time_minutes": 15,
                "difficulty": 1,
                "main_ingredients": ["番茄", "鸡蛋"],
                "steps": [
                    "番茄洗净切块，鸡蛋打散加少许盐",
                    "热锅冷油，倒入蛋液炒至金黄盛出",
                    "锅中加少许油，放入番茄翻炒出汁",
                    "加入炒好的鸡蛋，加盐糖调味，翻炒均匀出锅",
                ],
                "ingredients": [
                    {"name": "番茄", "quantity": 2, "unit": "个", "category": "vegetable", "estimated_price": 4.0},
                    {"name": "鸡蛋", "quantity": 3, "unit": "个", "category": "dairy", "estimated_price": 3.0},
                    {"name": "食用油", "quantity": 15, "unit": "ml", "category": "grain", "estimated_price": 0.5},
                    {"name": "盐", "quantity": 3, "unit": "g", "category": "spice", "estimated_price": 0.1},
                    {"name": "白糖", "quantity": 5, "unit": "g", "category": "spice", "estimated_price": 0.1},
                ],
            },
            {
                "id": "recipe-kungpao-chicken",
                "name": "宫保鸡丁",
                "thumbnail": None,
                "hero_image": None,
                "cook_time_minutes": 25,
                "difficulty": 2,
                "main_ingredients": ["鸡胸肉", "花生米", "干辣椒"],
                "steps": [
                    "鸡胸肉切丁，加料酒、生抽、淀粉腌制15分钟",
                    "调酱汁：生抽、醋、糖、淀粉、水混合",
                    "花生米炸至金黄备用，干辣椒切段去籽",
                    "热锅冷油，爆香干辣椒和花椒",
                    "下鸡丁炒至变色，加入葱段、姜片",
                    "倒入酱汁翻炒均匀，最后加入花生米出锅",
                ],
                "ingredients": [
                    {"name": "鸡胸肉", "quantity": 300, "unit": "g", "category": "meat", "estimated_price": 18.0},
                    {"name": "花生米", "quantity": 50, "unit": "g", "category": "grain", "estimated_price": 3.0},
                    {"name": "干辣椒", "quantity": 10, "unit": "个", "category": "spice", "estimated_price": 1.0},
                    {"name": "花椒", "quantity": 2, "unit": "g", "category": "spice", "estimated_price": 0.5},
                    {"name": "大葱", "quantity": 1, "unit": "根", "category": "vegetable", "estimated_price": 1.5},
                    {"name": "生姜", "quantity": 5, "unit": "g", "category": "vegetable", "estimated_price": 0.5},
                    {"name": "生抽", "quantity": 15, "unit": "ml", "category": "spice", "estimated_price": 0.5},
                    {"name": "醋", "quantity": 10, "unit": "ml", "category": "spice", "estimated_price": 0.3},
                    {"name": "白糖", "quantity": 10, "unit": "g", "category": "spice", "estimated_price": 0.2},
                    {"name": "淀粉", "quantity": 10, "unit": "g", "category": "grain", "estimated_price": 0.3},
                    {"name": "料酒", "quantity": 10, "unit": "ml", "category": "spice", "estimated_price": 0.5},
                    {"name": "食用油", "quantity": 30, "unit": "ml", "category": "grain", "estimated_price": 1.0},
                ],
            },
            {
                "id": "recipe-steamed-fish",
                "name": "清蒸鲈鱼",
                "thumbnail": None,
                "hero_image": None,
                "cook_time_minutes": 20,
                "difficulty": 2,
                "main_ingredients": ["鲈鱼", "葱姜"],
                "steps": [
                    "鲈鱼处理干净，两面划几刀，抹少许盐和料酒腌制10分钟",
                    "盘底铺上葱段和姜片，放入鲈鱼",
                    "水开后上锅蒸8分钟，关火焖2分钟",
                    "取出倒掉盘中汤汁，铺上新葱丝姜丝",
                    "淋上蒸鱼豉油，浇上滚热油即可",
                ],
                "ingredients": [
                    {"name": "鲈鱼", "quantity": 500, "unit": "g", "category": "seafood", "estimated_price": 35.0},
                    {"name": "大葱", "quantity": 2, "unit": "根", "category": "vegetable", "estimated_price": 3.0},
                    {"name": "生姜", "quantity": 15, "unit": "g", "category": "vegetable", "estimated_price": 1.0},
                    {"name": "蒸鱼豉油", "quantity": 20, "unit": "ml", "category": "spice", "estimated_price": 1.0},
                    {"name": "料酒", "quantity": 15, "unit": "ml", "category": "spice", "estimated_price": 0.8},
                    {"name": "盐", "quantity": 3, "unit": "g", "category": "spice", "estimated_price": 0.1},
                    {"name": "食用油", "quantity": 20, "unit": "ml", "category": "grain", "estimated_price": 0.7},
                ],
            },
            {
                "id": "recipe-mapo-tofu",
                "name": "麻婆豆腐",
                "thumbnail": None,
                "hero_image": None,
                "cook_time_minutes": 20,
                "difficulty": 2,
                "main_ingredients": ["嫩豆腐", "猪肉末", "豆瓣酱"],
                "steps": [
                    "豆腐切2cm方块，加盐水焯烫后捞出备用",
                    "猪肉末加少许生抽料酒腌制",
                    "热锅冷油，下肉末炒至变色",
                    "加入豆瓣酱、姜末、蒜末炒出红油",
                    "加入适量水烧开，下豆腐块轻轻推动",
                    "小火煮5分钟入味，水淀粉勾薄芡",
                    "出锅前撒上花椒粉和葱花",
                ],
                "ingredients": [
                    {"name": "嫩豆腐", "quantity": 400, "unit": "g", "category": "dairy", "estimated_price": 4.0},
                    {"name": "猪肉末", "quantity": 100, "unit": "g", "category": "meat", "estimated_price": 8.0},
                    {"name": "郫县豆瓣酱", "quantity": 20, "unit": "g", "category": "spice", "estimated_price": 1.0},
                    {"name": "大蒜", "quantity": 3, "unit": "瓣", "category": "vegetable", "estimated_price": 0.5},
                    {"name": "生姜", "quantity": 5, "unit": "g", "category": "vegetable", "estimated_price": 0.3},
                    {"name": "大葱", "quantity": 1, "unit": "根", "category": "vegetable", "estimated_price": 1.5},
                    {"name": "花椒粉", "quantity": 2, "unit": "g", "category": "spice", "estimated_price": 0.3},
                    {"name": "生抽", "quantity": 10, "unit": "ml", "category": "spice", "estimated_price": 0.3},
                    {"name": "淀粉", "quantity": 8, "unit": "g", "category": "grain", "estimated_price": 0.2},
                    {"name": "食用油", "quantity": 20, "unit": "ml", "category": "grain", "estimated_price": 0.7},
                    {"name": "盐", "quantity": 2, "unit": "g", "category": "spice", "estimated_price": 0.1},
                ],
            },
            {
                "id": "recipe-oatmeal-milk",
                "name": "牛奶燕麦粥",
                "thumbnail": None,
                "hero_image": None,
                "cook_time_minutes": 10,
                "difficulty": 1,
                "main_ingredients": ["燕麦片", "牛奶"],
                "steps": [
                    "燕麦片用清水浸泡5分钟",
                    "锅中加适量水烧开，加入燕麦片",
                    "小火煮5分钟至燕麦软糯",
                    "加入牛奶搅拌均匀，再煮2分钟",
                    "可根据口味加蜂蜜或水果",
                ],
                "ingredients": [
                    {"name": "燕麦片", "quantity": 50, "unit": "g", "category": "grain", "estimated_price": 2.0},
                    {"name": "牛奶", "quantity": 250, "unit": "ml", "category": "dairy", "estimated_price": 4.0},
                    {"name": "蜂蜜", "quantity": 10, "unit": "g", "category": "spice", "estimated_price": 1.0},
                ],
            },
            {
                "id": "recipe-sandwich",
                "name": "火腿鸡蛋三明治",
                "thumbnail": None,
                "hero_image": None,
                "cook_time_minutes": 12,
                "difficulty": 1,
                "main_ingredients": ["吐司", "火腿", "鸡蛋"],
                "steps": [
                    "吐司面包切去硬边（可选）",
                    "平底锅煎鸡蛋和火腿片",
                    "生菜洗净沥干水分",
                    "一片吐司上依次放生菜、火腿、鸡蛋、芝士片",
                    "盖上另一片吐司，轻轻压实，对角切开即可",
                ],
                "ingredients": [
                    {"name": "吐司面包", "quantity": 4, "unit": "片", "category": "grain", "estimated_price": 4.0},
                    {"name": "火腿片", "quantity": 4, "unit": "片", "category": "meat", "estimated_price": 8.0},
                    {"name": "鸡蛋", "quantity": 2, "unit": "个", "category": "dairy", "estimated_price": 2.0},
                    {"name": "生菜叶", "quantity": 4, "unit": "片", "category": "vegetable", "estimated_price": 2.0},
                    {"name": "芝士片", "quantity": 2, "unit": "片", "category": "dairy", "estimated_price": 4.0},
                    {"name": "沙拉酱", "quantity": 10, "unit": "g", "category": "spice", "estimated_price": 0.5},
                ],
            },
        ]

        for sr in sample_recipes:
            existing = await db.execute(select(Recipe).where(Recipe.id == sr["id"]))
            if existing.scalar_one_or_none():
                continue

            recipe = Recipe(
                id=sr["id"],
                name=sr["name"],
                author_id=DEFAULT_USER_ID,
                thumbnail=sr["thumbnail"],
                hero_image=sr["hero_image"],
                cook_time_minutes=sr["cook_time_minutes"],
                difficulty=sr["difficulty"],
                main_ingredients=sr["main_ingredients"],
                steps=sr["steps"],
                avg_rating=4.5,
                review_count=2,
            )
            db.add(recipe)

            for ing in sr["ingredients"]:
                ingredient = Ingredient(
                    recipe_id=sr["id"],
                    name=ing["name"],
                    quantity=ing["quantity"],
                    unit=ing["unit"],
                    category=ing["category"],
                    estimated_price=ing.get("estimated_price"),
                )
                db.add(ingredient)

        comments_seed = [
            {
                "recipe_id": "recipe-tomato-egg",
                "user_id": user2_id,
                "rating": 5,
                "content": "经典家常菜，百吃不厌！酸甜开胃，配米饭绝了。",
            },
            {
                "recipe_id": "recipe-kungpao-chicken",
                "user_id": user2_id,
                "rating": 4,
                "content": "步骤很详细，第一次做就成功了，就是花椒可以少放点。",
            },
        ]

        for cs in comments_seed:
            existing_c = await db.execute(
                select(Comment).where(
                    Comment.recipe_id == cs["recipe_id"],
                    Comment.user_id == cs["user_id"],
                )
            )
            if existing_c.scalar_one_or_none():
                continue
            comment = Comment(**cs)
            db.add(comment)

        await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_initial_data()
    yield


app = FastAPI(
    title="食谱协作管理 API",
    description="家庭协作食谱管理、菜单规划、智能采购清单生成后端服务",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key="recipe-app-secret-key")

app.include_router(recipes.router)
app.include_router(meal_plans.router)
app.include_router(shopping_list.router)


@app.get("/")
async def root():
    return {
        "name": "食谱协作管理 API",
        "version": "1.0.0",
        "docs": "/docs",
        "socket_path": "/socket.io",
    }


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


app = socketio.ASGIApp(socket_manager.sio, other_asgi_app=app)
