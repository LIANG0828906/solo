import json
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, Recall, HeatCache
from locations import LOCATIONS

HEAT_CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "heat_cache.json")
CACHE_DURATION = timedelta(minutes=10)
HEAT_WINDOW_DAYS = 30

def calculate_heat_for_location(db: Session, location_id: str, max_count: int) -> float:
    thirty_days_ago = datetime.utcnow() - timedelta(days=HEAT_WINDOW_DAYS)

    count = db.query(Recall).filter(
        Recall.location_id == location_id,
        Recall.timestamp >= thirty_days_ago
    ).count()

    if max_count == 0:
        return 0.0

    normalized = (count / max_count) * 100.0
    return min(normalized, 100.0)

def get_max_recall_count(db: Session) -> int:
    thirty_days_ago = datetime.utcnow() - timedelta(days=HEAT_WINDOW_DAYS)

    from sqlalchemy import func

    result = db.query(
        Recall.location_id,
        func.count(Recall.id).label('count')
    ).filter(
        Recall.timestamp >= thirty_days_ago
    ).group_by(
        Recall.location_id
    ).order_by(
        func.count(Recall.id).desc()
    ).first()

    return result[1] if result else 0

def update_heatmap():
    db = SessionLocal()
    try:
        max_count = get_max_recall_count(db)

        heat_data = []
        for loc in LOCATIONS:
            score = calculate_heat_for_location(db, loc["id"], max_count)

            cache_entry = db.query(HeatCache).filter(HeatCache.location_id == loc["id"]).first()
            if cache_entry:
                cache_entry.heat_score = score
                cache_entry.last_updated = datetime.utcnow()
            else:
                cache_entry = HeatCache(
                    location_id=loc["id"],
                    heat_score=score,
                    last_updated=datetime.utcnow()
                )
                db.add(cache_entry)

            heat_data.append({
                "location_id": loc["id"],
                "heat_score": score,
                "last_updated": datetime.utcnow().isoformat()
            })

        db.commit()

        cache_data = {
            "updated_at": datetime.utcnow().isoformat(),
            "data": heat_data
        }

        with open(HEAT_CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)

        print(f"[Heatmap Updater] Heatmap updated at {datetime.utcnow().isoformat()}")

    except Exception as e:
        print(f"[Heatmap Updater] Error updating heatmap: {e}")
        db.rollback()
    finally:
        db.close()

def get_cached_heatmap():
    if not os.path.exists(HEAT_CACHE_FILE):
        return None

    try:
        with open(HEAT_CACHE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[Heatmap Cache] Error reading cache: {e}")
        return None

def is_cache_valid(cache_data) -> bool:
    if not cache_data:
        return False

    try:
        updated_at = datetime.fromisoformat(cache_data["updated_at"])
        return datetime.utcnow() - updated_at < CACHE_DURATION
    except Exception:
        return False
