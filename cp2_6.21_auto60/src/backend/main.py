import sqlite3
import os
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import random

from food_data import FOODS, RECOMMENDED_INTAKE

DB_PATH = Path(__file__).parent / "nutrition.db"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FoodRecordCreate(BaseModel):
    foodId: int
    grams: float
    date: Optional[str] = None


class FoodRecordResponse(BaseModel):
    id: int
    foodId: int
    foodName: str
    grams: float
    calories: float
    protein: float
    fat: float
    carbs: float
    fiber: float
    sodium: float
    createdAt: str


class DailySummaryResponse(BaseModel):
    date: str
    totalCalories: float
    totalProtein: float
    totalFat: float
    totalCarbs: float
    totalFiber: float
    totalSodium: float
    records: List[FoodRecordResponse]


class DiagnosisAdvice(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    category: str
    alternatives: List[dict]


class AnalysisResponse(BaseModel):
    period: str
    avgCalories: float
    advices: List[DiagnosisAdvice]
    macroRatio: dict


class HistoryResponse(BaseModel):
    startDate: str
    endDate: str
    data: List[DailySummaryResponse]


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS foods (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            name_en TEXT,
            pinyin TEXT,
            calories REAL,
            protein REAL,
            fat REAL,
            carbs REAL,
            fiber REAL,
            sodium REAL,
            category TEXT
        )
    """)

    cursor.execute("SELECT COUNT(*) FROM foods")
    count = cursor.fetchone()[0]
    if count == 0:
        for food in FOODS:
            cursor.execute("""
                INSERT INTO foods (id, name, name_en, pinyin, calories, protein, fat, carbs, fiber, sodium, category)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                food["id"], food["name"], food["name_en"], food["pinyin"],
                food["calories"], food["protein"], food["fat"],
                food["carbs"], food["fiber"], food["sodium"], food["category"]
            ))

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS food_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            food_id INTEGER NOT NULL,
            food_name TEXT NOT NULL,
            grams REAL NOT NULL,
            calories REAL NOT NULL,
            protein REAL NOT NULL,
            fat REAL NOT NULL,
            carbs REAL NOT NULL,
            fiber REAL NOT NULL,
            sodium REAL NOT NULL,
            date TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


def calculate_nutrition(food, grams):
    factor = grams / 100.0
    return {
        "calories": round(food["calories"] * factor, 1),
        "protein": round(food["protein"] * factor, 1),
        "fat": round(food["fat"] * factor, 1),
        "carbs": round(food["carbs"] * factor, 1),
        "fiber": round(food["fiber"] * factor, 1),
        "sodium": round(food["sodium"] * factor, 1),
    }


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/api/food/search")
def search_food(q: str):
    conn = get_db()
    cursor = conn.cursor()

    query = f"%{q}%"
    cursor.execute("""
        SELECT * FROM foods
        WHERE name LIKE ? OR name_en LIKE ? OR pinyin LIKE ?
        ORDER BY 
            CASE WHEN name LIKE ? THEN 0 
                 WHEN name_en LIKE ? THEN 1 
                 ELSE 2 END,
            id
        LIMIT 20
    """, (query, query, query, query, query))

    rows = cursor.fetchall()
    conn.close()

    results = []
    for row in rows:
        results.append({
            "id": row["id"],
            "name": row["name"],
            "nameEn": row["name_en"],
            "pinyin": row["pinyin"],
            "calories": row["calories"],
            "protein": row["protein"],
            "fat": row["fat"],
            "carbs": row["carbs"],
            "fiber": row["fiber"],
            "sodium": row["sodium"],
            "category": row["category"],
        })
    return results


@app.post("/api/food/record", response_model=FoodRecordResponse)
def add_food_record(record: FoodRecordCreate):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM foods WHERE id = ?", (record.foodId,))
    food = cursor.fetchone()
    if not food:
        conn.close()
        raise HTTPException(status_code=404, detail="Food not found")

    nutrition = calculate_nutrition(food, record.grams)
    date_str = record.date if record.date else datetime.now().strftime("%Y-%m-%d")
    created_at = datetime.now().isoformat()

    cursor.execute("""
        INSERT INTO food_records (food_id, food_name, grams, calories, protein, fat, carbs, fiber, sodium, date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record.foodId, food["name"], record.grams,
        nutrition["calories"], nutrition["protein"], nutrition["fat"],
        nutrition["carbs"], nutrition["fiber"], nutrition["sodium"],
        date_str, created_at
    ))

    record_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": record_id,
        "foodId": record.foodId,
        "foodName": food["name"],
        "grams": record.grams,
        **nutrition,
        "createdAt": created_at
    }


@app.get("/api/food/record", response_model=DailySummaryResponse)
def get_records_by_date(date: str):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM food_records WHERE date = ? ORDER BY created_at DESC
    """, (date,))

    rows = cursor.fetchall()
    conn.close()

    records = []
    total_calories = 0.0
    total_protein = 0.0
    total_fat = 0.0
    total_carbs = 0.0
    total_fiber = 0.0
    total_sodium = 0.0

    for row in rows:
        rec = {
            "id": row["id"],
            "foodId": row["food_id"],
            "foodName": row["food_name"],
            "grams": row["grams"],
            "calories": row["calories"],
            "protein": row["protein"],
            "fat": row["fat"],
            "carbs": row["carbs"],
            "fiber": row["fiber"],
            "sodium": row["sodium"],
            "createdAt": row["created_at"],
        }
        records.append(rec)
        total_calories += row["calories"]
        total_protein += row["protein"]
        total_fat += row["fat"]
        total_carbs += row["carbs"]
        total_fiber += row["fiber"]
        total_sodium += row["sodium"]

    return {
        "date": date,
        "totalCalories": round(total_calories, 1),
        "totalProtein": round(total_protein, 1),
        "totalFat": round(total_fat, 1),
        "totalCarbs": round(total_carbs, 1),
        "totalFiber": round(total_fiber, 1),
        "totalSodium": round(total_sodium, 1),
        "records": records,
    }


@app.delete("/api/food/record/{record_id}")
def delete_record(record_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM food_records WHERE id = ?", (record_id,))
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    return {"success": deleted > 0}


@app.get("/api/analysis", response_model=AnalysisResponse)
def get_analysis(days: int = 7):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days - 1)
    start_str = start_date.strftime("%Y-%m-%d")
    end_str = end_date.strftime("%Y-%m-%d")

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT date, 
               SUM(calories) as totalCalories,
               SUM(protein) as totalProtein,
               SUM(fat) as totalFat,
               SUM(carbs) as totalCarbs,
               SUM(fiber) as totalFiber,
               SUM(sodium) as totalSodium
        FROM food_records
        WHERE date >= ? AND date <= ?
        GROUP BY date
        ORDER BY date
    """, (start_str, end_str))

    rows = cursor.fetchall()

    cursor.execute("SELECT * FROM foods")
    all_foods = cursor.fetchall()
    conn.close()

    food_list = [
        {
            "id": f["id"],
            "name": f["name"],
            "nameEn": f["name_en"],
            "pinyin": f["pinyin"],
            "calories": f["calories"],
            "protein": f["protein"],
            "fat": f["fat"],
            "carbs": f["carbs"],
            "fiber": f["fiber"],
            "sodium": f["sodium"],
            "category": f["category"],
        }
        for f in all_foods
    ]

    daily_data = []
    current = start_date
    for i in range(days):
        date_str = current.strftime("%Y-%m-%d")
        found = next((r for r in rows if r["date"] == date_str), None)
        if found:
            daily_data.append({
                "date": date_str,
                "totalCalories": found["totalCalories"],
                "totalProtein": found["totalProtein"],
                "totalFat": found["totalFat"],
                "totalCarbs": found["totalCarbs"],
                "totalFiber": found["totalFiber"],
                "totalSodium": found["totalSodium"],
                "records": [],
            })
        else:
            daily_data.append({
                "date": date_str,
                "totalCalories": 0,
                "totalProtein": 0,
                "totalFat": 0,
                "totalCarbs": 0,
                "totalFiber": 0,
                "totalSodium": 0,
                "records": [],
            })
        current += timedelta(days=1)

    valid_days = [d for d in daily_data if d["totalCalories"] > 0]
    actual_days = len(valid_days) if valid_days else 1

    avg_calories = sum(d["totalCalories"] for d in daily_data) / actual_days
    avg_protein = sum(d["totalProtein"] for d in daily_data) / actual_days
    avg_fat = sum(d["totalFat"] for d in daily_data) / actual_days
    avg_carbs = sum(d["totalCarbs"] for d in daily_data) / actual_days
    avg_fiber = sum(d["totalFiber"] for d in daily_data) / actual_days
    avg_sodium = sum(d["totalSodium"] for d in daily_data) / actual_days

    protein_cal = avg_protein * 4
    fat_cal = avg_fat * 9
    carbs_cal = avg_carbs * 4
    total_macro = protein_cal + fat_cal + carbs_cal if (protein_cal + fat_cal + carbs_cal) > 0 else 1

    macro_ratio = {
        "protein": round((protein_cal / total_macro) * 100),
        "fat": round((fat_cal / total_macro) * 100),
        "carbs": round((carbs_cal / total_macro) * 100),
    }

    advices = []

    def get_alternatives(categories):
        filtered = [f for f in food_list if f["category"] in categories]
        random.shuffle(filtered)
        return filtered[:5]

    if avg_calories > RECOMMENDED_INTAKE["calories"] * 1.15:
        advices.append({
            "id": "calories-excess",
            "title": "热量摄入超标",
            "description": f"近{days}天平均热量摄入约{avg_calories:.0f}千卡，超出推荐量{((avg_calories - RECOMMENDED_INTAKE['calories']) / RECOMMENDED_INTAKE['calories'] * 100):.0f}%。建议适当减少高热量食物，增加蔬菜和水果的摄入比例。",
            "severity": "high",
            "category": "calories",
            "alternatives": get_alternatives(["vegetable", "fruit"]),
        })
    elif avg_calories < RECOMMENDED_INTAKE["calories"] * 0.8 and avg_calories > 0:
        advices.append({
            "id": "calories-deficient",
            "title": "热量摄入不足",
            "description": f"近{days}天平均热量摄入约{avg_calories:.0f}千卡，低于推荐量{((RECOMMENDED_INTAKE['calories'] - avg_calories) / RECOMMENDED_INTAKE['calories'] * 100):.0f}%。建议适当增加主食和优质蛋白的摄入。",
            "severity": "medium",
            "category": "calories",
            "alternatives": get_alternatives(["grain", "meat"]),
        })

    if avg_protein < RECOMMENDED_INTAKE["protein"] * 0.8 and avg_calories > 0:
        advices.append({
            "id": "protein-deficient",
            "title": "蛋白质摄入不足",
            "description": f"近{days}天平均蛋白质摄入约{avg_protein:.1f}克，仅为推荐量的{(avg_protein / RECOMMENDED_INTAKE['protein'] * 100):.0f}%。蛋白质是身体修复和免疫的基础，建议增加优质蛋白食物。",
            "severity": "high",
            "category": "protein",
            "alternatives": get_alternatives(["meat", "egg", "bean"]),
        })

    if avg_fat > RECOMMENDED_INTAKE["fat"] * 1.2:
        advices.append({
            "id": "fat-excess",
            "title": "脂肪摄入超标",
            "description": f"近{days}天平均脂肪摄入约{avg_fat:.1f}克，超出推荐量{((avg_fat - RECOMMENDED_INTAKE['fat']) / RECOMMENDED_INTAKE['fat'] * 100):.0f}%。建议减少油炸食品和肥肉，选择更健康的烹饪方式。",
            "severity": "high",
            "category": "fat",
            "alternatives": get_alternatives(["vegetable", "grain"]),
        })

    if avg_fiber < RECOMMENDED_INTAKE["fiber"] * 0.8 and avg_calories > 0:
        advices.append({
            "id": "fiber-deficient",
            "title": "膳食纤维缺乏",
            "description": f"近{days}天平均膳食纤维摄入约{avg_fiber:.1f}克，仅为推荐量的{(avg_fiber / RECOMMENDED_INTAKE['fiber'] * 100):.0f}%。膳食纤维有助于肠道健康和饱腹感，建议多吃全谷物、蔬菜和水果。",
            "severity": "medium",
            "category": "fiber",
            "alternatives": get_alternatives(["vegetable", "fruit", "grain"]),
        })

    if avg_sodium > RECOMMENDED_INTAKE["sodium"] * 1.2:
        advices.append({
            "id": "sodium-excess",
            "title": "钠摄入超标",
            "description": f"近{days}天平均钠摄入约{avg_sodium:.0f}毫克，超出推荐量{((avg_sodium - RECOMMENDED_INTAKE['sodium']) / RECOMMENDED_INTAKE['sodium'] * 100):.0f}%。高钠饮食会增加高血压风险，建议减少盐和加工食品的摄入。",
            "severity": "high",
            "category": "sodium",
            "alternatives": get_alternatives(["vegetable", "fruit"]),
        })

    if avg_carbs > RECOMMENDED_INTAKE["carbs"] * 1.2:
        advices.append({
            "id": "carbs-excess",
            "title": "碳水化合物摄入偏高",
            "description": f"近{days}天平均碳水化合物摄入约{avg_carbs:.1f}克，占比偏高。建议适当减少精制碳水，选择低GI食物。",
            "severity": "low",
            "category": "carbs",
            "alternatives": get_alternatives(["vegetable", "meat"]),
        })

    if len(advices) == 0:
        advices.append({
            "id": "keep-going",
            "title": "膳食结构良好",
            "description": f"近{days}天营养摄入整体均衡，继续保持！建议多样化饮食，确保微量元素的摄入。",
            "severity": "low",
            "category": "calories",
            "alternatives": get_alternatives(["fruit", "nut"]),
        })

    return {
        "period": f"{days}天",
        "avgCalories": round(avg_calories, 0),
        "advices": advices[:5],
        "macroRatio": macro_ratio,
    }


@app.get("/api/history", response_model=HistoryResponse)
def get_history(startDate: str, endDate: str):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT date, 
               SUM(calories) as totalCalories,
               SUM(protein) as totalProtein,
               SUM(fat) as totalFat,
               SUM(carbs) as totalCarbs,
               SUM(fiber) as totalFiber,
               SUM(sodium) as totalSodium,
               COUNT(*) as record_count
        FROM food_records
        WHERE date >= ? AND date <= ?
        GROUP BY date
        ORDER BY date
    """, (startDate, endDate))

    rows = cursor.fetchall()
    conn.close()

    data_map = {}
    for row in rows:
        data_map[row["date"]] = {
            "date": row["date"],
            "totalCalories": round(row["totalCalories"], 1),
            "totalProtein": round(row["totalProtein"], 1),
            "totalFat": round(row["totalFat"], 1),
            "totalCarbs": round(row["totalCarbs"], 1),
            "totalFiber": round(row["totalFiber"], 1),
            "totalSodium": round(row["totalSodium"], 1),
            "records": [],
        }

    from datetime import datetime as dt, timedelta as td
    start_dt = dt.strptime(startDate, "%Y-%m-%d")
    end_dt = dt.strptime(endDate, "%Y-%m-%d")
    all_dates = []
    current = start_dt
    while current <= end_dt:
        date_str = current.strftime("%Y-%m-%d")
        if date_str in data_map:
            all_dates.append(data_map[date_str])
        else:
            all_dates.append({
                "date": date_str,
                "totalCalories": 0,
                "totalProtein": 0,
                "totalFat": 0,
                "totalCarbs": 0,
                "totalFiber": 0,
                "totalSodium": 0,
                "records": [],
            })
        current += td(days=1)

    return {
        "startDate": startDate,
        "endDate": endDate,
        "data": all_dates,
    }


@app.get("/api/report/weekly")
def generate_weekly_report(weekStart: str):
    report_text = f"周度营养报告\n"
    report_text += "=" * 30 + "\n\n"
    report_text += f"统计周期起始：{weekStart}\n"
    report_text += f"生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    report_text += "详细营养数据请参考历史趋势图。\n"
    report_text += "建议保持均衡饮食，适量运动，祝您健康！\n"

    return {
        "pdfUrl": f"/reports/weekly_{weekStart}.pdf",
        "fileName": f"营养周报_{weekStart}.pdf",
        "reportText": report_text,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
