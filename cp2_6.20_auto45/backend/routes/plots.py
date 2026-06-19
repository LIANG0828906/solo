from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import uuid
import time

router = APIRouter()

GRID_SIZE = 8

plots_db: Dict[str, dict] = {}
buildings_db: Dict[str, dict] = {}
animals_db: Dict[str, dict] = {}


def init_plots():
    for y in range(GRID_SIZE):
        for x in range(GRID_SIZE):
            plot_id = f"plot-{x}-{y}"
            plots_db[plot_id] = {
                "id": plot_id,
                "x": x,
                "y": y,
                "status": "empty",
                "cropId": None,
                "plantedAt": None,
                "buildingId": None
            }
    
    buildings_db["b1"] = {
        "id": "b1",
        "typeId": "chicken",
        "x": 6,
        "y": 0
    }
    buildings_db["b2"] = {
        "id": "b2",
        "typeId": "cow",
        "x": 0,
        "y": 6
    }
    
    now = int(time.time() * 1000)
    animals_db["a1"] = {
        "id": "a1",
        "type": "chicken",
        "health": 80,
        "lastFed": now,
        "productReadyAt": now + 60000,
        "buildingId": "b1",
        "icon": "🐔"
    }
    animals_db["a2"] = {
        "id": "a2",
        "type": "chicken",
        "health": 65,
        "lastFed": now - 30000,
        "productReadyAt": now + 120000,
        "buildingId": "b1",
        "icon": "🐔"
    }
    animals_db["a3"] = {
        "id": "a3",
        "type": "cow",
        "health": 90,
        "lastFed": now,
        "productReadyAt": now + 180000,
        "buildingId": "b2",
        "icon": "🐮"
    }


init_plots()


class PlantRequest(BaseModel):
    cropId: str


class BuildRequest(BaseModel):
    buildingTypeId: str
    x: int
    y: int


class FeedRequest(BaseModel):
    buildingId: str


class CollectRequest(BaseModel):
    buildingId: str


@router.get("")
async def get_plots():
    return list(plots_db.values())


@router.post("/{plot_id}/plant")
async def plant_crop(plot_id: str, data: PlantRequest):
    if plot_id not in plots_db:
        raise HTTPException(status_code=404, detail="地块不存在")
    
    plot = plots_db[plot_id]
    if plot["status"] != "empty":
        raise HTTPException(status_code=400, detail="该地块已被使用")
    
    plot["status"] = "seed"
    plot["cropId"] = data.cropId
    plot["plantedAt"] = int(time.time() * 1000)
    
    return plot


@router.post("/{plot_id}/harvest")
async def harvest_crop(plot_id: str):
    if plot_id not in plots_db:
        raise HTTPException(status_code=404, detail="地块不存在")
    
    plot = plots_db[plot_id]
    if plot["status"] != "mature":
        raise HTTPException(status_code=400, detail="作物尚未成熟")
    
    crop_id = plot["cropId"]
    plot["status"] = "empty"
    plot["cropId"] = None
    plot["plantedAt"] = None
    
    rewards = {"wheat": 25, "carrot": 40, "tomato": 55, "corn": 70}
    return {"reward": rewards.get(crop_id, 20), "cropId": crop_id}


@router.post("/build")
async def build_structure(data: BuildRequest):
    building_id = f"building-{uuid.uuid4().hex[:8]}"
    building = {
        "id": building_id,
        "typeId": data.buildingTypeId,
        "x": data.x,
        "y": data.y
    }
    buildings_db[building_id] = building
    
    for dy in range(2):
        for dx in range(2):
            plot_id = f"plot-{data.x + dx}-{data.y + dy}"
            if plot_id in plots_db:
                plots_db[plot_id]["status"] = "building"
                plots_db[plot_id]["buildingId"] = building_id
    
    return building


@router.get("/buildings")
async def get_buildings():
    return list(buildings_db.values())


@router.get("/animals")
async def get_animals():
    return list(animals_db.values())


@router.post("/animals/feed")
async def feed_animals(data: FeedRequest):
    now = int(time.time() * 1000)
    fed_animals = []
    
    for animal in animals_db.values():
        if animal["buildingId"] == data.buildingId:
            animal["health"] = min(100, animal["health"] + 20)
            animal["lastFed"] = now
            fed_animals.append(animal)
    
    return fed_animals


@router.post("/animals/collect")
async def collect_product(data: CollectRequest):
    now = int(time.time() * 1000)
    collected = 0
    product_name = ""
    
    building = buildings_db.get(data.buildingId)
    if building:
        building_types = {
            "chicken": "鸡蛋",
            "cow": "牛奶",
            "sheep": "羊毛"
        }
        product_name = building_types.get(building["typeId"], "产品")
    
    for animal in animals_db.values():
        if animal["buildingId"] == data.buildingId and animal["productReadyAt"] <= now:
            animal["productReadyAt"] = now + 120000
            collected += 1
    
    return {"product": product_name, "amount": collected}
