from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any

from .data_generator import (
    get_cities,
    generate_current_data,
    generate_all_current_data,
    generate_history_data,
)

app = FastAPI(title="城市空气质量监测 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_CITY_IDS = [city["id"] for city in get_cities()]


@app.get("/api/cities")
async def get_city_list() -> Dict[str, Any]:
    return {"cities": get_cities()}


@app.get("/api/current")
async def get_all_current() -> Dict[str, Any]:
    return {"data": generate_all_current_data()}


@app.get("/api/current/{city_id}")
async def get_city_current(city_id: str) -> Dict[str, Any]:
    if city_id not in VALID_CITY_IDS:
        raise HTTPException(status_code=404, detail=f"City {city_id} not found")
    return generate_current_data(city_id)


@app.get("/api/history/{city_id}")
async def get_city_history(city_id: str) -> Dict[str, Any]:
    if city_id not in VALID_CITY_IDS:
        raise HTTPException(status_code=404, detail=f"City {city_id} not found")
    return generate_history_data(city_id)


@app.get("/api/health")
async def health_check() -> Dict[str, str]:
    return {"status": "ok"}
