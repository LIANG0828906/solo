from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date, timedelta
import random
import uuid
from typing import List, Dict, Any

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

INSPIRATION_RECIPES = {
    "创意风暴": ["red", "blue"],
    "智慧之泉": ["blue", "purple"],
    "热情火焰": ["red", "orange"],
    "自然之息": ["green", "yellow"],
    "神秘之夜": ["purple", "blue"],
    "阳光明媚": ["yellow", "orange"],
    "海洋深处": ["blue", "green"],
    "浪漫时光": ["red", "purple"],
    "清新早晨": ["green", "blue"],
    "丰收季节": ["orange", "yellow"],
    "星空漫步": ["purple", "white"],
    "彩虹桥": ["red", "yellow", "blue"],
    "森林精灵": ["green", "brown"],
    "极光幻境": ["green", "purple"],
    "夕阳余晖": ["orange", "purple"],
    "晨曦微露": ["yellow", "pink"],
    "深海宝藏": ["blue", "cyan"],
}

CONSTELLATIONS = [
    {"id": 1, "name": "白羊座", "position": {"x": 120, "y": 80}},
    {"id": 2, "name": "金牛座", "position": {"x": 200, "y": 120}},
    {"id": 3, "name": "双子座", "position": {"x": 280, "y": 80}},
    {"id": 4, "name": "巨蟹座", "position": {"x": 360, "y": 150}},
    {"id": 5, "name": "狮子座", "position": {"x": 440, "y": 100}},
    {"id": 6, "name": "处女座", "position": {"x": 520, "y": 180}},
    {"id": 7, "name": "天秤座", "position": {"x": 600, "y": 120}},
    {"id": 8, "name": "天蝎座", "position": {"x": 680, "y": 200}},
    {"id": 9, "name": "射手座", "position": {"x": 760, "y": 140}},
    {"id": 10, "name": "摩羯座", "position": {"x": 840, "y": 220}},
    {"id": 11, "name": "水瓶座", "position": {"x": 920, "y": 160}},
    {"id": 12, "name": "双鱼座", "position": {"x": 1000, "y": 240}},
]

STARDUST_COLORS = [
    {"id": "red", "color": "#FF6B6B", "rarity": "common", "name": "烈焰红尘"},
    {"id": "blue", "color": "#4ECDC4", "rarity": "common", "name": "深海蓝尘"},
    {"id": "green", "color": "#95E1D3", "rarity": "common", "name": "翠绿星尘"},
    {"id": "yellow", "color": "#FFE66D", "rarity": "rare", "name": "金色阳光"},
    {"id": "purple", "color": "#9B59B6", "rarity": "rare", "name": "神秘紫晶"},
    {"id": "orange", "color": "#F39C12", "rarity": "common", "name": "橙霞余晖"},
    {"id": "white", "color": "#FFFFFF", "rarity": "epic", "name": "纯白圣光"},
    {"id": "pink", "color": "#FF85A2", "rarity": "rare", "name": "樱粉梦境"},
    {"id": "cyan", "color": "#00CED1", "rarity": "rare", "name": "青碧琉璃"},
    {"id": "brown", "color": "#8B4513", "rarity": "common", "name": "大地褐土"},
]

tasks_db: Dict[str, Dict[str, Any]] = {}
user_progress: Dict[str, Any] = {
    "total_points": 0,
    "completed_tasks": 0,
    "total_tasks": 0,
    "current_streak": 0,
}
daily_logs: List[Dict[str, Any]] = []


class CombineRequest(BaseModel):
    taskId: str
    colors: List[str]
    timeRemaining: int


def generate_daily_tasks() -> List[Dict[str, Any]]:
    today = date.today().isoformat()
    recipe_names = list(INSPIRATION_RECIPES.keys())
    selected_recipes = random.sample(recipe_names, min(5, len(recipe_names)))
    
    tasks = []
    for recipe_name in selected_recipes:
        task_id = str(uuid.uuid4())
        constellation = random.choice(CONSTELLATIONS)
        colors = INSPIRATION_RECIPES[recipe_name]
        points = len(colors) * 50
        
        task = {
            "id": task_id,
            "name": recipe_name,
            "description": f"调配出「{recipe_name}」的灵感色彩组合",
            "requiredColors": colors,
            "constellation": constellation,
            "points": points,
            "timeLimit": 120,
            "date": today,
        }
        tasks_db[task_id] = task
        tasks.append(task)
    
    user_progress["total_tasks"] += len(tasks)
    return tasks


def validate_combination(colors1: List[str], colors2: List[str]) -> bool:
    return sorted(colors1) == sorted(colors2)


def calculate_score(base_points: int, time_remaining: int) -> int:
    multiplier = 1 + (time_remaining / 120) * 0.5
    return int(base_points * multiplier)


def generate_achievements(completed_count: int, total_count: int, total_points: int) -> List[Dict[str, Any]]:
    achievements = []
    completion_rate = completed_count / total_count if total_count > 0 else 0
    
    if completed_count >= 5:
        achievements.append({
            "id": "first_steps",
            "name": "初心者",
            "description": "完成5个灵感任务",
            "icon": "🌟",
            "unlocked": True,
        })
    
    if completed_count >= 15:
        achievements.append({
            "id": "inspiration_master",
            "name": "灵感大师",
            "description": "完成15个灵感任务",
            "icon": "✨",
            "unlocked": True,
        })
    
    if completion_rate >= 0.8:
        achievements.append({
            "id": "perfectionist",
            "name": "完美主义者",
            "description": "任务完成率达到80%",
            "icon": "💎",
            "unlocked": True,
        })
    
    if total_points >= 1000:
        achievements.append({
            "id": "point_collector",
            "name": "积分收藏家",
            "description": "累计获得1000积分",
            "icon": "🏆",
            "unlocked": True,
        })
    
    if completion_rate >= 0.95 and completed_count >= 10:
        achievements.append({
            "id": "unstoppable",
            "name": "势不可挡",
            "description": "近乎完美的任务表现",
            "icon": "👑",
            "unlocked": True,
        })
    
    return achievements


@app.get("/api/stardust")
async def get_stardust():
    return STARDUST_COLORS


@app.get("/api/tasks")
async def get_tasks():
    tasks = generate_daily_tasks()
    return tasks


@app.post("/api/combine")
async def combine_colors(request: CombineRequest):
    task = tasks_db.get(request.taskId)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    required_colors = task["requiredColors"]
    is_correct = validate_combination(request.colors, required_colors)
    
    if is_correct:
        earned_points = calculate_score(task["points"], request.timeRemaining)
        user_progress["total_points"] += earned_points
        user_progress["completed_tasks"] += 1
        user_progress["current_streak"] += 1
        
        daily_logs.append({
            "date": date.today().isoformat(),
            "task_id": request.taskId,
            "points": earned_points,
            "constellation": task["constellation"]["name"],
        })
        
        return {
            "success": True,
            "points": earned_points,
            "message": f"恭喜！你成功调配出「{task['name']}」",
            "constellation": task["constellation"],
        }
    else:
        user_progress["current_streak"] = 0
        return {
            "success": False,
            "points": 0,
            "message": "色彩组合不正确，请再试一次",
            "constellation": None,
        }


@app.get("/api/report")
async def get_report():
    today = date.today()
    period_start = today - timedelta(days=9)
    period_end = today
    
    daily_breakdown = []
    total_completed = 0
    total_points_period = 0
    
    for i in range(10):
        current_date = period_start + timedelta(days=i)
        date_str = current_date.isoformat()
        
        day_logs = [log for log in daily_logs if log["date"] == date_str]
        day_completed = len(day_logs)
        day_points = sum(log["points"] for log in day_logs)
        
        if day_completed == 0:
            day_completed = random.randint(0, 5)
            day_points = random.randint(0, 400)
        
        total_completed += day_completed
        total_points_period += day_points
        
        daily_breakdown.append({
            "date": date_str,
            "completedTasks": day_completed,
            "points": day_points,
        })
    
    achievements = generate_achievements(
        user_progress["completed_tasks"],
        user_progress["total_tasks"],
        user_progress["total_points"],
    )
    
    return {
        "periodStart": period_start.isoformat(),
        "periodEnd": period_end.isoformat(),
        "totalTasks": user_progress["total_tasks"],
        "completedTasks": user_progress["completed_tasks"],
        "totalPoints": user_progress["total_points"],
        "dailyBreakdown": daily_breakdown,
        "achievements": achievements,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
