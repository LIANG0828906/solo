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
    habits = [r[0] for r in records]
    return {"habits": habits}


@app.post("/habits")
def add_habit(habit_data: HabitName, db: Session = Depends(get_db)):
    existing_habits = db.query(HabitRecord.habit_name).distinct().all()
    if len(existing_habits) >= 10:
        raise HTTPException(status_code=400, detail="最多只能添加10个习惯")
    
    today = get_today_str()
    
    existing = (
        db.query(HabitRecord)
        .filter(
            HabitRecord.habit_name == habit_data.habit_name,
            HabitRecord.date == today,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="该习惯已存在")
    
    new_record = HabitRecord(
        habit_name=habit_data.habit_name,
        date=today,
        completed=False,
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return {"message": "习惯添加成功"}


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
            "habit_name": record.habit_name,
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
            "habit_name": new_record.habit_name,
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
            result_records.append(
                HabitRecordResponse(
                    id=record.id,
                    habit_name=record.habit_name,
                    date=record.date,
                    completed=record.completed,
                )
            )
        else:
            new_record = HabitRecord(
                habit_name=habit_name,
                date=date,
                completed=False,
            )
            db.add(new_record)
            db.commit()
            db.refresh(new_record)
            result_records.append(
                HabitRecordResponse(
                    id=new_record.id,
                    habit_name=new_record.habit_name,
                    date=new_record.date,
                    completed=new_record.completed,
                )
            )
    
    return {"records": result_records}


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
        completion_rate = (completed_count / total_habits * 100) if total_habits > 0 else 0
        
        daily_stats.append({
            "date": current_date_str,
            "completed_count": completed_count,
            "total_habits": total_habits,
            "completion_rate": round(completion_rate, 1),
        })
        
        for r in records:
            if r.completed and r.habit_name in habit_stats_dict:
                habit_stats_dict[r.habit_name] += 1
    
    habit_stats = [
        {"habit_name": name, "completed_days": count}
        for name, count in habit_stats_dict.items()
    ]
    
    return {"daily_stats": daily_stats, "habit_stats": habit_stats}


@app.get("/heatmap")
def get_heatmap(
    year: Optional[int] = None,
    db: Session = Depends(get_db),
):
    if year is None:
        year = date.today().year
    
    start_date = date(year, 1, 1)
    end_date = date(year, 12, 31)
    
    data = []
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        
        records = (
            db.query(HabitRecord)
            .filter(
                HabitRecord.date == date_str,
                HabitRecord.completed == True,
            )
            .count()
        )
        
        data.append({
            "date": date_str,
            "value": records,
        })
        
        current_date += timedelta(days=1)
    
    return {"data": data}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
