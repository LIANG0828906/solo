from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, timedelta
import uuid
import random

app = FastAPI(title="习惯养成追踪 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Habit(BaseModel):
    id: str
    name: str
    frequency: str
    targetCount: int
    reminderTimes: List[str]
    createdAt: str
    completionRate: float
    streak: int

class CreateHabitPayload(BaseModel):
    name: str
    frequency: str
    targetCount: int
    reminderTimes: List[str]

class HabitRecord(BaseModel):
    id: str
    habitId: str
    date: str
    completed: bool
    completedAt: Optional[str] = None

class ToggleRecordPayload(BaseModel):
    habitId: str
    date: str

class ChallengeParticipant(BaseModel):
    id: str
    name: str
    progress: float
    rank: int

class Challenge(BaseModel):
    id: str
    title: str
    description: str
    startDate: str
    endDate: str
    participantCount: int
    progress: float
    participants: List[ChallengeParticipant]
    joined: bool

class StatsData(BaseModel):
    completionRateByDay: List[dict]
    heatmapData: List[dict]
    streakRanking: List[dict]

habits_db = [
    {
        "id": "1",
        "name": "晨间锻炼",
        "frequency": "daily",
        "targetCount": 1,
        "reminderTimes": ["07:00"],
        "createdAt": "2025-01-01",
        "completionRate": 0.85,
        "streak": 12,
    },
    {
        "id": "2",
        "name": "阅读30分钟",
        "frequency": "daily",
        "targetCount": 1,
        "reminderTimes": ["21:00"],
        "createdAt": "2025-01-05",
        "completionRate": 0.72,
        "streak": 5,
    },
    {
        "id": "3",
        "name": "喝8杯水",
        "frequency": "daily",
        "targetCount": 8,
        "reminderTimes": ["09:00", "12:00", "15:00", "18:00"],
        "createdAt": "2025-01-10",
        "completionRate": 0.65,
        "streak": 3,
    },
    {
        "id": "4",
        "name": "冥想",
        "frequency": "daily",
        "targetCount": 1,
        "reminderTimes": ["08:00", "22:00"],
        "createdAt": "2025-02-01",
        "completionRate": 0.45,
        "streak": 0,
    },
]

records_db = []

def generate_mock_records():
    today = date.today()
    for habit in habits_db:
        for i in range(30):
            d = today - timedelta(days=i)
            if random.random() > 0.3:
                hour = random.randint(8, 20)
                minute = random.randint(0, 59)
                records_db.append({
                    "id": str(uuid.uuid4()),
                    "habitId": habit["id"],
                    "date": d.isoformat(),
                    "completed": True,
                    "completedAt": f"{d.isoformat()}T{hour:02d}:{minute:02d}:00",
                })

generate_mock_records()

challenges_db = [
    {
        "id": "c1",
        "title": "30天早起挑战",
        "description": "每天早上7点前起床，坚持30天养成早睡早起的好习惯！",
        "startDate": "2025-06-01",
        "endDate": "2025-06-30",
        "participantCount": 1256,
        "progress": 65,
        "joined": False,
        "participants": [
            {"id": "p1", "name": "小明", "progress": 90, "rank": 1},
            {"id": "p2", "name": "花儿", "progress": 85, "rank": 2},
            {"id": "p3", "name": "阿杰", "progress": 78, "rank": 3},
            {"id": "p4", "name": "我", "progress": 65, "rank": 156},
        ],
    },
    {
        "id": "c2",
        "title": "21天阅读计划",
        "description": "每天阅读30分钟，21天后你会看到不一样的自己。",
        "startDate": "2025-06-10",
        "endDate": "2025-06-30",
        "participantCount": 892,
        "progress": 50,
        "joined": True,
        "participants": [
            {"id": "p1", "name": "书虫达人", "progress": 95, "rank": 1},
            {"id": "p2", "name": "阅读爱好者", "progress": 88, "rank": 2},
            {"id": "p3", "name": "我", "progress": 50, "rank": 120},
            {"id": "p4", "name": "萌新读者", "progress": 35, "rank": 200},
        ],
    },
    {
        "id": "c3",
        "title": "每日喝水挑战",
        "description": "每天喝够8杯水，保持健康生活方式。",
        "startDate": "2025-06-01",
        "endDate": "2025-07-01",
        "participantCount": 2341,
        "progress": 72,
        "joined": False,
        "participants": [
            {"id": "p1", "name": "健康达人", "progress": 98, "rank": 1},
            {"id": "p2", "name": "水杯侠", "progress": 92, "rank": 2},
            {"id": "p3", "name": "水壶王", "progress": 85, "rank": 3},
        ],
    },
    {
        "id": "c4",
        "title": "健身打卡30天",
        "description": "坚持运动30天，每天锻炼至少30分钟，见证身体的蜕变！",
        "startDate": "2025-06-15",
        "endDate": "2025-07-15",
        "participantCount": 567,
        "progress": 30,
        "joined": False,
        "participants": [
            {"id": "p1", "name": "健身教练", "progress": 100, "rank": 1},
            {"id": "p2", "name": "运动达人", "progress": 80, "rank": 2},
        ],
    },
]

@app.get("/api/habits", response_model=List[Habit])
def get_habits():
    return habits_db

@app.post("/api/habits", response_model=Habit)
def create_habit(payload: CreateHabitPayload):
    new_habit = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "frequency": payload.frequency,
        "targetCount": payload.targetCount,
        "reminderTimes": payload.reminderTimes,
        "createdAt": date.today().isoformat(),
        "completionRate": 0,
        "streak": 0,
    }
    habits_db.insert(0, new_habit)
    return new_habit

@app.put("/api/habits/{habit_id}", response_model=Habit)
def update_habit(habit_id: str, payload: CreateHabitPayload):
    for habit in habits_db:
        if habit["id"] == habit_id:
            habit.update(payload.dict())
            return habit
    raise HTTPException(status_code=404, detail="Habit not found")

@app.delete("/api/habits/{habit_id}")
def delete_habit(habit_id: str):
    global habits_db
    habits_db = [h for h in habits_db if h["id"] != habit_id]
    return {"success": True}

@app.get("/api/records", response_model=List[HabitRecord])
def get_records(date: Optional[str] = None):
    if date:
        return [r for r in records_db if r["date"] == date]
    return records_db

@app.get("/api/records/range", response_model=List[HabitRecord])
def get_records_range(startDate: str, endDate: str):
    return [r for r in records_db if startDate <= r["date"] <= endDate]

@app.post("/api/records/toggle", response_model=HabitRecord)
def toggle_record(payload: ToggleRecordPayload):
    global records_db
    existing = None
    for r in records_db:
        if r["habitId"] == payload.habitId and r["date"] == payload.date:
            existing = r
            break
    
    if existing:
        records_db = [r for r in records_db if not (r["habitId"] == payload.habitId and r["date"] == payload.date)]
        return {"id": "", "habitId": payload.habitId, "date": payload.date, "completed": False}
    else:
        new_record = {
            "id": str(uuid.uuid4()),
            "habitId": payload.habitId,
            "date": payload.date,
            "completed": True,
            "completedAt": datetime.now().isoformat(),
        }
        records_db.append(new_record)
        return new_record

@app.get("/api/stats", response_model=StatsData)
def get_stats(days: int = 30):
    today = date.today()
    completionRateByDay = []
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        rate = 0.4 + random.random() * 0.5
        completionRateByDay.append({
            "date": d.isoformat(),
            "rate": min(1, rate),
        })

    heatmapData = []
    for hour in range(0, 24):
        for weekday in range(7):
            total_count = random.randint(2, 12)
            count = int(total_count * random.uniform(0.2, 1.0))
            completion_rate = count / total_count if total_count > 0 else 0
            if count > 1:
                heatmapData.append({
                    "hour": hour, 
                    "weekday": weekday, 
                    "count": count,
                    "totalCount": total_count,
                    "completionRate": completion_rate,
                })

    habitHeatmapData = []
    for habit in habits_db:
        for hour in range(0, 24):
            total_count = random.randint(2, 10)
            count = int(total_count * random.uniform(0.3, 1.0))
            completion_rate = count / total_count if total_count > 0 else 0
            if count > 1:
                habitHeatmapData.append({
                    "hour": hour,
                    "habitId": habit["id"],
                    "habitName": habit["name"],
                    "count": count,
                    "totalCount": total_count,
                    "completionRate": completion_rate,
                })

    streakRanking = sorted(
        [{"habitName": h["name"], "streak": h["streak"], "habitId": h["id"]} for h in habits_db],
        key=lambda x: x["streak"],
        reverse=True,
    )[:5]

    habits = [{"id": h["id"], "name": h["name"]} for h in habits_db]

    return {
        "completionRateByDay": completionRateByDay,
        "heatmapData": heatmapData,
        "habitHeatmapData": habitHeatmapData,
        "streakRanking": streakRanking,
        "habits": habits,
    }

@app.get("/api/challenges", response_model=List[Challenge])
def get_challenges():
    return challenges_db

@app.post("/api/challenges/{challenge_id}/join", response_model=Challenge)
def join_challenge(challenge_id: str):
    for c in challenges_db:
        if c["id"] == challenge_id:
            c["joined"] = True
            c["participantCount"] += 1
            return c
    raise HTTPException(status_code=404, detail="Challenge not found")

@app.get("/api/challenges/{challenge_id}/ranking", response_model=List[ChallengeParticipant])
def get_challenge_ranking(challenge_id: str):
    for c in challenges_db:
        if c["id"] == challenge_id:
            return c["participants"]
    raise HTTPException(status_code=404, detail="Challenge not found")

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
