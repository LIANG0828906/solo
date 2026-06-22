from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import random
from collections import Counter

from flower_data import (
    get_flowers_as_dict,
    get_flower_by_id,
    FLOWERS,
    Flower,
    Season,
    COLOR_HARMONY,
    SEASON_COMPATIBILITY
)

app = FastAPI(title="花语设计室 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendationRequest(BaseModel):
    current_flower_ids: List[str]
    num_suggestions: int = 3


class RecommendationResponse(BaseModel):
    scheme_id: str
    flowers: List[Dict[str, Any]]
    score: float
    reason: str


@app.get("/")
async def root():
    return {"message": "欢迎来到花语设计室 API", "version": "1.0.0"}


@app.get("/flowers")
async def get_flowers(category: Optional[str] = None):
    flowers = get_flowers_as_dict()
    if category:
        flowers = [f for f in flowers if f["category"] == category]
    return {"count": len(flowers), "flowers": flowers}


@app.get("/flowers/{flower_id}")
async def get_flower(flower_id: str):
    try:
        flower = get_flower_by_id(flower_id)
        return {
            "id": flower.id,
            "name": flower.name,
            "category": flower.category.value,
            "color": flower.color,
            "color_hex": flower.color_hex,
            "shape": flower.shape.value,
            "height": flower.height,
            "seasons": [s.value for s in flower.seasons],
            "meaning": flower.meaning,
            "image": flower.image,
            "pairings": flower.pairings
        }
    except ValueError:
        raise HTTPException(status_code=404, detail="花材不存在")


@app.get("/flowers/{flower_id}/pairings")
async def get_flower_pairings(flower_id: str):
    try:
        flower = get_flower_by_id(flower_id)
        pairings = []
        for pid in flower.pairings:
            try:
                pf = get_flower_by_id(pid)
                pairings.append({
                    "id": pf.id,
                    "name": pf.name,
                    "color_hex": pf.color_hex,
                    "image": pf.image
                })
            except ValueError:
                continue
        return {"flower_id": flower_id, "pairings": pairings}
    except ValueError:
        raise HTTPException(status_code=404, detail="花材不存在")


def calculate_harmony_score(flower_ids: List[str]) -> float:
    if len(flower_ids) == 0:
        return 0.0
    if len(flower_ids) == 1:
        return 0.6

    flowers = []
    for fid in flower_ids:
        try:
            flowers.append(get_flower_by_id(fid))
        except ValueError:
            continue

    if len(flowers) < 2:
        return 0.5

    score = 0.0
    total_pairs = 0

    for i in range(len(flowers)):
        for j in range(i + 1, len(flowers)):
            f1, f2 = flowers[i], flowers[j]
            pair_score = 0.0

            if f1.color in COLOR_HARMONY and f2.color in COLOR_HARMONY[f1.color]:
                pair_score += 0.4
            if f2.color in COLOR_HARMONY and f1.color in COLOR_HARMONY[f2.color]:
                pair_score += 0.4

            f1_seasons = set(s for s in f1.seasons)
            f2_seasons = set(s for s in f2.seasons)
            if f1_seasons & f2_seasons:
                pair_score += 0.2

            if f2.id in f1.pairings or f1.id in f2.pairings:
                pair_score += 0.3

            categories = {f1.category, f2.category}
            if len(categories) == 2:
                pair_score += 0.1

            score += pair_score
            total_pairs += 1

    if total_pairs > 0:
        score = score / total_pairs

    categories_used = set(f.category for f in flowers)
    variety_bonus = min(len(categories_used) / 4.0, 0.15)
    score = min(score + variety_bonus, 1.0)

    return score


def generate_reason(flowers: List[Flower], score: float) -> str:
    reasons = []

    if len(flowers) >= 2:
        colors = set(f.color for f in flowers)
        if len(colors) >= 2:
            all_harmony = True
            color_list = list(colors)
            for i in range(len(color_list)):
                for j in range(i + 1, len(color_list)):
                    c1, c2 = color_list[i], color_list[j]
                    if c1 in COLOR_HARMONY and c2 not in COLOR_HARMONY[c1]:
                        all_harmony = False
                        break
            if all_harmony:
                reasons.append("配色和谐统一")

    seasons_set = set()
    for f in flowers:
        seasons_set.update(f.seasons)
    common_seasons = set(s for s in Season)
    for f in flowers:
        common_seasons = common_seasons & set(f.seasons)
    if common_seasons:
        reasons.append(f"{'/'.join(s.value for s in common_seasons)}季搭配适宜")

    categories = set(f.category for f in flowers)
    if len(categories) >= 3:
        reasons.append("花材层次丰富")

    if not reasons:
        reasons.append("花材各具特色")

    if score >= 0.85:
        prefix = "完美搭配"
    elif score >= 0.7:
        prefix = "优秀组合"
    elif score >= 0.55:
        prefix = "不错的选择"
    else:
        prefix = "有提升空间"

    return f"{prefix}：{'，'.join(reasons)}"


def build_scheme(core_ids: List[str], candidate_ids: List[str], target_count: int) -> List[str]:
    scheme = list(core_ids)
    candidates = [cid for cid in candidate_ids if cid not in scheme]
    random.shuffle(candidates)

    idx = 0
    while len(scheme) < target_count and idx < len(candidates):
        scheme.append(candidates[idx])
        idx += 1

    return scheme


@app.post("/recommendation", response_model=List[RecommendationResponse])
async def get_recommendations(request: RecommendationRequest):
    current_flowers = []
    for fid in request.current_flower_ids:
        try:
            current_flowers.append(get_flower_by_id(fid))
        except ValueError:
            continue

    all_flower_ids = [f.id for f in FLOWERS]
    current_ids = [f.id for f in current_flowers]
    target_count = max(5, len(current_ids) + 2)

    candidate_ids = []

    for flower in current_flowers:
        for pid in flower.pairings:
            if pid in all_flower_ids and pid not in candidate_ids and pid not in current_ids:
                candidate_ids.append(pid)

    current_colors = set(f.color for f in current_flowers)
    for f in FLOWERS:
        if f.id in current_ids or f.id in candidate_ids:
            continue
        is_harmony = False
        for cc in current_colors:
            if cc in COLOR_HARMONY and f.color in COLOR_HARMONY[cc]:
                is_harmony = True
                break
            if f.color in COLOR_HARMONY and cc in COLOR_HARMONY[f.color]:
                is_harmony = True
                break
        if is_harmony:
            candidate_ids.append(f.id)

    current_categories = set(f.category for f in current_flowers)
    for f in FLOWERS:
        if f.id in current_ids or f.id in candidate_ids:
            continue
        if f.category not in current_categories:
            candidate_ids.append(f.id)

    for f in FLOWERS:
        if f.id not in current_ids and f.id not in candidate_ids:
            candidate_ids.append(f.id)

    schemes = []

    if candidate_ids:
        scheme_1_core = list(current_ids)
        if candidate_ids:
            top_candidates = candidate_ids[:max(3, len(candidate_ids))]
            scheme_1 = build_scheme(scheme_1_core, top_candidates, target_count)
            schemes.append(scheme_1)

        harmony_candidates = []
        for cid in candidate_ids:
            try:
                cf = get_flower_by_id(cid)
                is_harmony = True
                for cur_f in current_flowers:
                    cur_colors = COLOR_HARMONY.get(cur_f.color, [])
                    if cf.color not in cur_colors and cur_f.color not in COLOR_HARMONY.get(cf.color, []):
                        if not (set(cur_f.seasons) & set(cf.seasons)):
                            is_harmony = False
                            break
                if is_harmony:
                    harmony_candidates.append(cid)
            except ValueError:
                continue

        scheme_2 = build_scheme(list(current_ids), harmony_candidates if harmony_candidates else candidate_ids, target_count)
        schemes.append(scheme_2)

        variety_candidates = []
        for cid in candidate_ids:
            try:
                cf = get_flower_by_id(cid)
                if cf.category not in current_categories:
                    variety_candidates.append(cid)
            except ValueError:
                continue
        scheme_3 = build_scheme(list(current_ids), variety_candidates if variety_candidates else candidate_ids, target_count)
        schemes.append(scheme_3)
    else:
        all_pool = [fid for fid in all_flower_ids if fid not in current_ids]
        for i in range(3):
            scheme = build_scheme(list(current_ids), all_pool, target_count)
            schemes.append(scheme)

    results = []
    seen = set()
    for idx, scheme_ids in enumerate(schemes):
        key = tuple(sorted(scheme_ids))
        if key in seen:
            continue
        seen.add(key)

        try:
            scheme_flowers = [get_flower_by_id(fid) for fid in scheme_ids]
        except ValueError:
            continue

        score = calculate_harmony_score(scheme_ids)
        reason = generate_reason(scheme_flowers, score)

        flower_dicts = []
        for f in scheme_flowers:
            flower_dicts.append({
                "id": f.id,
                "name": f.name,
                "category": f.category.value,
                "color": f.color,
                "color_hex": f.color_hex,
                "shape": f.shape.value,
                "height": f.height,
                "seasons": [s.value for s in f.seasons],
                "meaning": f.meaning,
                "image": f.image,
                "pairings": f.pairings
            })

        results.append(RecommendationResponse(
            scheme_id=f"scheme-{idx + 1}",
            flowers=flower_dicts,
            score=score,
            reason=reason
        ))

    results.sort(key=lambda x: x.score, reverse=True)
    return results[:request.num_suggestions]


@app.post("/score")
async def calculate_score(request: RecommendationRequest):
    score = calculate_harmony_score(request.current_flower_ids)
    stars = max(1, min(5, int(score * 5 + 0.5)))
    return {
        "score": score,
        "stars": stars,
        "percentage": round(score * 100, 1)
    }
