from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .data_generator import (
    CITIES,
    get_current_data,
    get_all_current_data,
    get_history_data,
)

app = FastAPI(title="空气质量监测 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/cities")
async def get_cities():
    return {"cities": CITIES}


@app.get("/api/current/{city_id}")
async def get_city_current(city_id: str):
    valid_ids = [c["id"] for c in CITIES]
    if city_id not in valid_ids:
        raise HTTPException(status_code=404, detail=f"城市不存在")
    return get_current_data(city_id)


@app.get("/api/current")
async def get_all_current():
    return {"data": get_all_current_data()}


@app.get("/api/history/{city_id}")
async def get_city_history(city_id: str):
    valid_ids = [c["id"] for c in CITIES]
    if city_id not in valid_ids:
        raise HTTPException(status_code=404, detail=f"城市不存在")
    return get_history_data(city_id)
