from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date, timedelta, datetime
from typing import Optional
from models import (
    Base,
    engine,
    SessionLocal,
    HabitRecord,
    HabitName,
    ToggleRecord,
    HabitRecordResponse,
)

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


def get_today_str():
    return date.today().strftime("%Y-%m-%d")


@app.get("/habits")
def get_habits(db: Session = Depends(get_db)):
    records = db.query(HabitRecord.habit_name).distinct().all()
    habits = [{"name": r[0]} for r in records]
    return habits


@app.post("/habits")
def add_habit(habit_data: HabitName, db: Session = Depends(get_db)):
    existing_habits = db.query(HabitRecord.habit_name).distinct().all()
    if len(existing_habits) >= 10:
        raise HTTPException(status_code=400, detail="最多只能添加10个习惯")
    
    today = get_today_str()
    habit_name = habit_data.habit_name or habit_data.name
    
    existing = (
        db.query(HabitRecord)
        .filter(
            HabitRecord.habit_name == habit_name,
            HabitRecord.date == today,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="该习惯已存在")
    
    new_record = HabitRecord(
        habit_name=habit_name,
        date=today,
        completed=False,
    )
    db.add(new_record)
    db.commit()
    return {"name": habit_name}


@app.delete("/habits/{habit_name}")
def delete_habit(habit_name: str, db: Session = Depends(get_db)):
    records = (
        db.query(HabitRecord)
        .filter(HabitRecord.habit_name == habit_name)
        .all()
    )
    if not records:
        raise HTTPException(status_code=404, detail="习惯不存在")
    
    for record in records:
        db.delete(record)
    db.commit()
    return {"message": "习惯删除成功"}


@app.delete("/records")
def delete_record(habit_name: str, date: str, db: Session = Depends(get_db)):
    record = (
        db.query(HabitRecord)
        .filter(
            HabitRecord.habit_name == habit_name,
            HabitRecord.date == date,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    db.delete(record)
    db.commit()
    return {"message": "记录删除成功"}


@app.post("/habits/toggle")
def toggle_habit(toggle_data: ToggleRecord, db: Session = Depends(get_db)):
    record = (
        db.query(HabitRecord)
        .filter(
            HabitRecord.habit_name == toggle_data.habit_name,
            HabitRecord.date == toggle_data.date,
        )
        .first()
    )
    
    if record:
        record.completed = not record.completed
        db.commit()
        db.refresh(record)
        return {
            "id": record.id,
            "habitName": record.habit_name,
            "date": record.date,
            "completed": record.completed,
        }
    else:
        new_record = HabitRecord(
            habit_name=toggle_data.habit_name,
            date=toggle_data.date,
            completed=True,
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return {
            "id": new_record.id,
            "habitName": new_record.habit_name,
            "date": new_record.date,
            "completed": new_record.completed,
        }


@app.get("/records")
def get_records(
    date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if date is None:
        date = get_today_str()
    
    records = (
        db.query(HabitRecord)
        .filter(HabitRecord.date == date)
        .all()
    )
    
    habit_names = db.query(HabitRecord.habit_name).distinct().all()
    habit_names = [h[0] for h in habit_names]
    
    result_records = []
    for habit_name in habit_names:
        record = next((r for r in records if r.habit_name == habit_name), None)
        if record:
            result_records.append({
                "id": record.id,
                "habitName": record.habit_name,
                "date": record.date,
                "completed": record.completed,
            })
        else:
            new_record = HabitRecord(
                habit_name=habit_name,
                date=date,
                completed=False,
            )
            db.add(new_record)
            db.commit()
            db.refresh(new_record)
            result_records.append({
                "id": new_record.id,
                "habitName": new_record.habit_name,
                "date": new_record.date,
                "completed": new_record.completed,
            })
    
    return result_records


@app.get("/stats")
def get_stats(
    days: int = 30,
    db: Session = Depends(get_db),
):
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    
    daily_stats = []
    habit_stats_dict = {}
    
    habit_names = db.query(HabitRecord.habit_name).distinct().all()
    habit_names = [h[0] for h in habit_names]
    total_habits = len(habit_names)
    
    for habit_name in habit_names:
        habit_stats_dict[habit_name] = 0
    
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        current_date_str = current_date.strftime("%Y-%m-%d")
        
        records = (
            db.query(HabitRecord)
            .filter(HabitRecord.date == current_date_str)
            .all()
        )
        
        completed_count = sum(1 for r in records if r.completed)
        percentage = round((completed_count / total_habits * 100), 1) if total_habits > 0 else 0
        
        daily_stats.append({
            "date": current_date_str,
            "completed": completed_count,
            "total": total_habits,
            "percentage": percentage,
        })
        
        for r in records:
            if r.completed and r.habit_name in habit_stats_dict:
                habit_stats_dict[r.habit_name] += 1
    
    habit_stats = [
        {
            "habitName": name,
            "completedDays": count,
            "totalDays": days,
            "percentage": round((count / days * 100), 1) if days > 0 else 0,
            "currentStreak": 0,
            "longestStreak": 0,
        }
        for name, count in habit_stats_dict.items()
    ]

    overall_total = sum(1 for d in daily_stats if d["completed"] > 0)
    
    return {
        "habits": habit_stats,
        "daily": daily_stats,
        "overall": {
            "totalHabits": total_habits,
            "totalRecords": len(daily_stats) * total_habits,
            "avgCompletion": round(sum(d["percentage"] for d in daily_stats) / max(len(daily_stats), 1), 1),
            "bestStreak": overall_total,
        },
    }


@app.get("/heatmap")
def get_heatmap(
    year: Optional[int] = None,
    habit_names: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if year is None:
        year = date.today().year

    start_date = date(year, 1, 1)
    end_date = date(year, 12, 31)
    start_str = start_date.strftime("%Y-%m-%d")
    end_str = end_date.strftime("%Y-%m-%d")

    query = db.query(HabitRecord).filter(
        HabitRecord.date >= start_str,
        HabitRecord.date <= end_str,
    )

    selected_names = None
    if habit_names:
        selected_names = [n.strip() for n in habit_names.split(",") if n.strip()]
        if selected_names:
            query = query.filter(HabitRecord.habit_name.in_(selected_names))

    records = query.all()

    date_map: dict = {}
    for r in records:
        ds = r.date
        if ds not in date_map:
            date_map[ds] = {}
        date_map[ds][r.habit_name] = r.completed

    if selected_names:
        target_names = selected_names
    else:
        all_habits = set()
        for habits in date_map.values():
            all_habits.update(habits.keys())
        target_names = list(all_habits)

    total_habits = len(target_names)

    data = []
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        day_habits = date_map.get(date_str, {})

        if selected_names:
            habit_details = {
                n: day_habits.get(n, False) for n in selected_names
            }
            value = sum(1 for n in selected_names if day_habits.get(n, False))
            data.append({
                "date": date_str,
                "value": value,
                "habit_details": habit_details,
            })
        else:
            value = sum(1 for v in day_habits.values() if v)
            data.append({
                "date": date_str,
                "value": value,
            })

        current_date += timedelta(days=1)

    return {"data": data, "total_habits": total_habits}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
