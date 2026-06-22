import json
import math
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, SessionLocal, Base
from models import Batch, TasteNote, Comment
from schemas import (
    BatchCreate, BatchResponse,
    TasteNoteCreate, TasteNoteResponse,
    CommentCreate, CommentResponse,
    PublicBatch, PublicBatchDetail, CommunityResponse,
)
import crud


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_curve(bean_type: str, roast_level: str) -> tuple[list, list, float, float, float]:
    phase1_duration = 4.0
    phase2_duration = 4.0
    phase3_duration = 4.0

    if roast_level == "浅":
        phase2_end_temp = 195
        phase3_end_temp = 185
    elif roast_level == "中浅":
        phase2_end_temp = 205
        phase3_end_temp = 195
    elif roast_level == "中":
        phase2_end_temp = 215
        phase3_end_temp = 205
    elif roast_level == "中深":
        phase2_end_temp = 225
        phase3_end_temp = 215
    else:
        phase2_end_temp = 235
        phase3_end_temp = 225

    charge_temp = 22.0
    drop_temp = phase3_end_temp
    total_time = phase1_duration + phase2_duration + phase3_duration

    curve_data = []
    markers = []

    steps_per_phase = 12

    for i in range(steps_per_phase + 1):
        t = phase1_duration * i / steps_per_phase
        progress = i / steps_per_phase
        bean_temp = 22 + (150 - 22) * progress
        env_temp = bean_temp + 40 + 10 * math.sin(progress * math.pi)
        ror = 18 - 4 * progress
        curve_data.append({"time": round(t, 2), "bean_temp": round(bean_temp, 1), "env_temp": round(env_temp, 1), "ror": round(ror, 1), "phase": 1})

    markers.append({"time": 0.0, "label": "入豆"})

    for i in range(1, steps_per_phase + 1):
        t = phase1_duration + phase2_duration * i / steps_per_phase
        progress = i / steps_per_phase
        bean_temp = 150 + (phase2_end_temp - 150) * progress
        env_temp = bean_temp + 35 - 5 * progress
        ror = 14 - 6 * progress
        curve_data.append({"time": round(t, 2), "bean_temp": round(bean_temp, 1), "env_temp": round(env_temp, 1), "ror": round(ror, 1), "phase": 2})

    markers.append({"time": phase1_duration, "label": "转黄点"})
    markers.append({"time": phase1_duration + phase2_duration * 0.5, "label": "一爆开始"})

    for i in range(1, steps_per_phase + 1):
        t = phase1_duration + phase2_duration + phase3_duration * i / steps_per_phase
        progress = i / steps_per_phase
        bean_temp = phase2_end_temp + (phase3_end_temp - phase2_end_temp) * progress
        env_temp = bean_temp + 30 - 10 * progress
        ror = 8 - 6 * progress
        curve_data.append({"time": round(t, 2), "bean_temp": round(bean_temp, 1), "env_temp": round(env_temp, 1), "ror": round(ror, 1), "phase": 3})

    markers.append({"time": phase1_duration + phase2_duration, "label": "一爆结束"})
    markers.append({"time": total_time, "label": "出豆"})

    return curve_data, markers, charge_temp, drop_temp, total_time


def seed_data(db: Session):
    if db.query(Batch).first():
        return

    sample_data = [
        {"bean_type": "埃塞俄比亚", "roast_level": "浅", "rating": 5,
         "taste_notes": [
             {"category": "香气", "sub_flavors": ["花香", "柑橘"]},
             {"category": "酸度", "sub_flavors": ["果酸", "莓果"]},
         ],
         "comments": ["非常明亮的果酸，花香味浓郁！", "耶加雪菲的典型风味"]},
        {"bean_type": "埃塞俄比亚", "roast_level": "中浅", "rating": 4,
         "taste_notes": [
             {"category": "香气", "sub_flavors": ["茉莉花", "柠檬"]},
             {"category": "酸度", "sub_flavors": ["柑橘", "蓝莓"]},
         ],
         "comments": ["中浅烘更平衡一些"]},
        {"bean_type": "哥伦比亚", "roast_level": "中", "rating": 4,
         "taste_notes": [
             {"category": "香气", "sub_flavors": ["坚果", "焦糖"]},
             {"category": "醇度", "sub_flavors": ["巧克力", "太妃糖"]},
         ],
         "comments": ["经典的哥伦比亚风味，非常均衡"]},
        {"bean_type": "哥伦比亚", "roast_level": "中深", "rating": 3,
         "taste_notes": [
             {"category": "香气", "sub_flavors": ["可可", "香草"]},
             {"category": "醇度", "sub_flavors": ["黑巧克力", "坚果"]},
         ],
         "comments": ["适合做拿铁"]},
        {"bean_type": "巴西", "roast_level": "中深", "rating": 4,
         "taste_notes": [
             {"category": "香气", "sub_flavors": ["巧克力", "坚果"]},
             {"category": "醇度", "sub_flavors": ["焦糖", "奶油"]},
         ],
         "comments": ["很顺滑，做意式浓缩很棒"]},
        {"bean_type": "巴西", "roast_level": "深", "rating": 3,
         "taste_notes": [
             {"category": "香气", "sub_flavors": ["烟熏", "黑巧克力"]},
             {"category": "醇度", "sub_flavors": ["焦炭", "可可"]},
         ],
         "comments": ["深烘有烟熏感，适合加奶"]},
        {"bean_type": "肯尼亚", "roast_level": "浅", "rating": 5,
         "taste_notes": [
             {"category": "香气", "sub_flavors": ["黑加仑", "番茄"]},
             {"category": "酸度", "sub_flavors": ["葡萄柚", "黑莓"]},
         ],
         "comments": ["肯尼亚AA的酸甜感太棒了！", "复杂度很高"]},
        {"bean_type": "肯尼亚", "roast_level": "中浅", "rating": 4,
         "taste_notes": [
             {"category": "香气", "sub_flavors": ["红醋栗", "猕猴桃"]},
             {"category": "酸度", "sub_flavors": ["柠檬", "李子"]},
         ],
         "comments": ["中浅烘保留了很好的果酸"]},
        {"bean_type": "埃塞俄比亚", "roast_level": "中", "rating": 4,
         "taste_notes": [
             {"category": "香气", "sub_flavors": ["蜂蜜", "杏仁"]},
             {"category": "醇度", "sub_flavors": ["红茶", "桃子"]},
         ],
         "comments": ["日晒处理的风味很丰富"]},
        {"bean_type": "哥伦比亚", "roast_level": "浅", "rating": 3,
         "taste_notes": [
             {"category": "香气", "sub_flavors": ["青苹果", "花香"]},
             {"category": "酸度", "sub_flavors": ["柑橘", "葡萄"]},
         ],
         "comments": ["浅烘的哥伦比亚也很不错"]},
        {"bean_type": "巴西", "roast_level": "中", "rating": 4,
         "taste_notes": [
             {"category": "香气", "sub_flavors": ["花生", "红糖"]},
             {"category": "醇度", "sub_flavors": ["榛果", "巧克力"]},
         ],
         "comments": ["经典的中烘巴西，非常舒适"]},
        {"bean_type": "埃塞俄比亚", "roast_level": "中深", "rating": 3,
         "taste_notes": [
             {"category": "香气", "sub_flavors": ["可可", "干果"]},
             {"category": "醇度", "sub_flavors": ["焦糖", "黑茶"]},
         ],
         "comments": ["中深烘的埃塞别有一番风味"]},
    ]

    for item in sample_data:
        curve_data, markers, charge_temp, drop_temp, total_time = generate_curve(
            item["bean_type"], item["roast_level"]
        )
        batch = Batch(
            bean_type=item["bean_type"],
            roast_level=item["roast_level"],
            charge_temp=charge_temp,
            drop_temp=drop_temp,
            total_time=total_time,
            curve_data=json.dumps(curve_data),
            markers=json.dumps(markers),
            is_public=True,
            rating=item["rating"],
        )
        db.add(batch)
        db.flush()

        for tn in item.get("taste_notes", []):
            note = TasteNote(
                batch_id=batch.id,
                category=tn["category"],
                sub_flavors=json.dumps(tn["sub_flavors"], ensure_ascii=False),
            )
            db.add(note)

        for c in item.get("comments", []):
            comment = Comment(
                batch_id=batch.id,
                content=c,
            )
            db.add(comment)

    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/batches", response_model=BatchResponse)
def api_create_batch(batch: BatchCreate, db: Session = Depends(get_db)):
    return crud.create_batch(db, batch)


@app.get("/api/batches/{batch_id}", response_model=BatchResponse)
def api_get_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = crud.get_batch(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@app.get("/api/batches", response_model=list[BatchResponse])
def api_list_batches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.list_batches(db, skip, limit)


@app.post("/api/batches/{batch_id}/clone", response_model=BatchResponse)
def api_clone_batch(batch_id: int, db: Session = Depends(get_db)):
    cloned = crud.clone_batch(db, batch_id)
    if not cloned:
        raise HTTPException(status_code=404, detail="Batch not found")
    return cloned


@app.post("/api/taste-notes", response_model=TasteNoteResponse)
def api_create_taste_note(note: TasteNoteCreate, db: Session = Depends(get_db)):
    return crud.create_taste_note(db, note)


@app.get("/api/batches/{batch_id}/taste-notes", response_model=list[TasteNoteResponse])
def api_get_taste_notes(batch_id: int, db: Session = Depends(get_db)):
    return crud.get_taste_notes_by_batch(db, batch_id)


@app.get("/api/community", response_model=CommunityResponse)
def api_list_community(
    bean_type: str | None = None,
    roast_level: str | None = None,
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
):
    items, total = crud.list_public_batches(db, bean_type, roast_level, page, page_size)
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@app.get("/api/community/{batch_id}", response_model=PublicBatchDetail)
def api_get_community_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = crud.get_batch(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@app.post("/api/comments", response_model=CommentResponse)
def api_create_comment(comment: CommentCreate, db: Session = Depends(get_db)):
    return crud.create_comment(db, comment)


@app.get("/api/batches/{batch_id}/comments", response_model=list[CommentResponse])
def api_get_comments(batch_id: int, db: Session = Depends(get_db)):
    return crud.get_comments_by_batch(db, batch_id)
