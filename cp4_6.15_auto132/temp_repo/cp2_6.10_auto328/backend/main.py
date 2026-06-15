import json
import random
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATA_DIR = Path(__file__).parent / "data"


def load_json(filename: str):
    filepath = DATA_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"Data file {filename} not found")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(filename: str, data):
    filepath = DATA_DIR / filename
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class Fragment(BaseModel):
    id: str
    name: str
    icon: str
    color: str


class Challenge(BaseModel):
    id: int
    name: str
    description: str
    requiredFragments: List[str]
    points: int
    timeLimit: int


class Achievement(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    rarity: str


class CombinationRequest(BaseModel):
    challengeId: int
    fragments: List[str]
    completionTime: Optional[int] = None


class CombinationResult(BaseModel):
    success: bool
    message: str
    points: int
    unlockedAchievements: List[Achievement]


class ScoreSubmission(BaseModel):
    challengeId: int
    points: int
    completionTime: Optional[int] = None
    fragmentsUsed: List[str]


class DailyRecord(BaseModel):
    date: str
    completedCount: int
    totalPoints: int


class WeeklyReport(BaseModel):
    weekStart: str
    weekEnd: str
    dailyRecords: List[DailyRecord]
    totalCompleted: int
    totalPoints: int
    achievements: List[Achievement]


app = FastAPI(title="Creative Inventor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/fragments", response_model=List[Fragment])
async def get_fragments():
    return load_json("fragments.json")


@app.get("/api/challenges/today", response_model=List[Challenge])
async def get_today_challenges():
    all_challenges = load_json("challenges.json")
    today_str = datetime.now().strftime("%Y-%m-%d")
    user_data = load_json("user_data.json")

    daily_records = user_data.get("dailyRecords", [])
    today_record = next((r for r in daily_records if r.get("date") == today_str), None)

    if today_record and "challengeIds" in today_record:
        selected_ids = today_record["challengeIds"]
        selected = [c for c in all_challenges if c["id"] in selected_ids]
    else:
        selected = random.sample(all_challenges, min(5, len(all_challenges)))
        selected_ids = [c["id"] for c in selected]

        if not today_record:
            today_record = {
                "date": today_str,
                "completedCount": 0,
                "totalPoints": 0,
                "challengeIds": selected_ids,
                "completedIds": [],
            }
            daily_records.append(today_record)
        else:
            today_record["challengeIds"] = selected_ids

        user_data["dailyRecords"] = daily_records
        save_json("user_data.json", user_data)

    return selected


@app.post("/api/combine", response_model=CombinationResult)
async def combine_fragments(request: CombinationRequest):
    all_challenges = load_json("challenges.json")
    challenge = next((c for c in all_challenges if c["id"] == request.challengeId), None)

    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    required = Counter(challenge["requiredFragments"])
    provided = Counter(request.fragments)

    success = required == provided
    unlocked_achievements = []

    if success:
        user_data = load_json("user_data.json")
        all_achievements = load_json("achievements.json")
        user_achievement_ids = set(user_data.get("achievements", []))

        completed_ids = set(user_data.get("completedChallenges", []))
        if len(completed_ids) == 0:
            achievement = next((a for a in all_achievements if a["id"] == "first_invention"), None)
            if achievement and achievement["id"] not in user_achievement_ids:
                unlocked_achievements.append(Achievement(**achievement))

        if request.completionTime and request.completionTime <= 30:
            achievement = next((a for a in all_achievements if a["id"] == "speed_inventor"), None)
            if achievement and achievement["id"] not in user_achievement_ids:
                unlocked_achievements.append(Achievement(**achievement))

        if challenge["points"] >= 100:
            achievement = next((a for a in all_achievements if a["id"] == "hundred_points"), None)
            if achievement and achievement["id"] not in user_achievement_ids:
                unlocked_achievements.append(Achievement(**achievement))

        used_types = set()
        for record in user_data.get("dailyRecords", []):
            for frag in record.get("fragmentsUsed", []):
                used_types.add(frag)
        for frag in request.fragments:
            used_types.add(frag)
        if len(used_types) >= 5:
            achievement = next((a for a in all_achievements if a["id"] == "collector"), None)
            if achievement and achievement["id"] not in user_achievement_ids:
                unlocked_achievements.append(Achievement(**achievement))

        if len(completed_ids) + 1 >= 50:
            achievement = next((a for a in all_achievements if a["id"] == "creative_master"), None)
            if achievement and achievement["id"] not in user_achievement_ids:
                unlocked_achievements.append(Achievement(**achievement))

        has_legendary = any(a for a in unlocked_achievements if a.rarity == "legendary")
        if has_legendary:
            achievement = next((a for a in all_achievements if a["id"] == "legendary_craftsman"), None)
            if achievement and achievement["id"] not in user_achievement_ids:
                unlocked_achievements.append(Achievement(**achievement))

        message = f"🎉 成功！你发明了「{challenge['name']}」！获得 {challenge['points']} 分！"
    else:
        message = "❌ 组合失败，这些碎片似乎不太对..."

    return CombinationResult(
        success=success,
        message=message,
        points=challenge["points"] if success else 0,
        unlockedAchievements=unlocked_achievements,
    )


@app.get("/api/report/weekly", response_model=WeeklyReport)
async def get_weekly_report():
    user_data = load_json("user_data.json")
    all_achievements = load_json("achievements.json")

    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    daily_records = []
    total_completed = 0
    total_points = 0

    for i in range(7):
        current_date = week_start + timedelta(days=i)
        date_str = current_date.strftime("%Y-%m-%d")

        record = next(
            (r for r in user_data.get("dailyRecords", []) if r.get("date") == date_str),
            None,
        )

        if record:
            daily_records.append(
                DailyRecord(
                    date=date_str,
                    completedCount=record.get("completedCount", 0),
                    totalPoints=record.get("totalPoints", 0),
                )
            )
            total_completed += record.get("completedCount", 0)
            total_points += record.get("totalPoints", 0)
        else:
            daily_records.append(
                DailyRecord(date=date_str, completedCount=0, totalPoints=0)
            )

    user_achievement_ids = set(user_data.get("achievements", []))
    achievements = [
        Achievement(**a)
        for a in all_achievements
        if a["id"] in user_achievement_ids
    ]

    return WeeklyReport(
        weekStart=week_start.strftime("%Y-%m-%d"),
        weekEnd=week_end.strftime("%Y-%m-%d"),
        dailyRecords=daily_records,
        totalCompleted=total_completed,
        totalPoints=total_points,
        achievements=achievements,
    )


@app.post("/api/score/submit")
async def submit_score(submission: ScoreSubmission):
    user_data = load_json("user_data.json")
    today_str = datetime.now().strftime("%Y-%m-%d")

    user_data["totalScore"] = user_data.get("totalScore", 0) + submission.points

    completed_challenges = user_data.get("completedChallenges", [])
    if submission.challengeId not in completed_challenges:
        completed_challenges.append(submission.challengeId)
    user_data["completedChallenges"] = completed_challenges

    daily_records = user_data.get("dailyRecords", [])
    today_record = next((r for r in daily_records if r.get("date") == today_str), None)

    if not today_record:
        today_record = {
            "date": today_str,
            "completedCount": 0,
            "totalPoints": 0,
            "completedIds": [],
            "fragmentsUsed": [],
        }
        daily_records.append(today_record)

    if submission.challengeId not in today_record.get("completedIds", []):
        today_record["completedCount"] = today_record.get("completedCount", 0) + 1

    today_record["totalPoints"] = today_record.get("totalPoints", 0) + submission.points

    completed_ids = today_record.get("completedIds", [])
    if submission.challengeId not in completed_ids:
        completed_ids.append(submission.challengeId)
    today_record["completedIds"] = completed_ids

    fragments_used = today_record.get("fragmentsUsed", [])
    for frag in submission.fragmentsUsed:
        if frag not in fragments_used:
            fragments_used.append(frag)
    today_record["fragmentsUsed"] = fragments_used

    all_challenges = load_json("challenges.json")
    challenge = next((c for c in all_challenges if c["id"] == submission.challengeId), None)
    challenge_ids_today = today_record.get("challengeIds", [])
    if challenge and len(challenge_ids_today) > 0:
        if set(today_record.get("completedIds", [])) >= set(challenge_ids_today):
            all_achievements = load_json("achievements.json")
            user_achievement_ids = set(user_data.get("achievements", []))
            perfect_day_achievement = next(
                (a for a in all_achievements if a["id"] == "perfect_day"), None
            )
            if perfect_day_achievement and perfect_day_achievement["id"] not in user_achievement_ids:
                user_data["achievements"].append(perfect_day_achievement["id"])

    user_data["dailyRecords"] = daily_records

    save_json("user_data.json", user_data)

    return {
        "message": "Score submitted successfully",
        "totalScore": user_data["totalScore"],
        "completedChallenges": len(user_data["completedChallenges"]),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
