from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import uuid
import time
import json
import os

router = APIRouter()

GRID_SIZE = 8
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

PLOTS_FILE = os.path.join(DATA_DIR, 'plots.json')
BUILDINGS_FILE = os.path.join(DATA_DIR, 'buildings.json')
ANIMALS_FILE = os.path.join(DATA_DIR, 'animals.json')

plots_db: Dict[str, dict] = {}
buildings_db: Dict[str, dict] = {}
animals_db: Dict[str, dict] = {}


def save_to_file(data: dict, filepath: str):
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存数据失败: {e}")


def load_from_file(filepath: str, default: dict) -> dict:
    try:
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"加载数据失败: {e}")
    return default


def init_plots():
    global plots_db, buildings_db, animals_db
    
    plots_db = load_from_file(PLOTS_FILE, {})
    buildings_db = load_from_file(BUILDINGS_FILE, {})
    animals_db = load_from_file(ANIMALS_FILE, {})
    
    if not plots_db:
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
        save_to_file(plots_db, PLOTS_FILE)
    
    if not buildings_db:
        buildings_db = {
            "b1": {
                "id": "b1",
                "typeId": "chicken",
                "x": 6,
                "y": 0
            },
            "b2": {
                "id": "b2",
                "typeId": "cow",
                "x": 0,
                "y": 6
            }
        }
        for bid, building in buildings_db.items():
            for plot in plots_db.values():
                if (plot["x"] == building["x"] and plot["y"] == building["y"]):
                    plot["status"] = "building"
                    plot["buildingId"] = bid
        save_to_file(buildings_db, BUILDINGS_FILE)
        save_to_file(plots_db, PLOTS_FILE)
    
    if not animals_db:
        now = int(time.time() * 1000)
        animals_db = {
            "a1": {
                "id": "a1",
                "type": "chicken",
                "health": 80,
                "lastFed": now,
                "productReadyAt": now + 60000,
                "buildingId": "b1",
                "icon": "🐔"
            },
            "a2": {
                "id": "a2",
                "type": "chicken",
                "health": 65,
                "lastFed": now - 30000,
                "productReadyAt": now + 120000,
                "buildingId": "b1",
                "icon": "🐔"
            },
            "a3": {
                "id": "a3",
                "type": "cow",
                "health": 90,
                "lastFed": now,
                "productReadyAt": now + 180000,
                "buildingId": "b2",
                "icon": "🐮"
            }
        }
        save_to_file(animals_db, ANIMALS_FILE)


init_plots()


def get_current_plot_status(plot: dict) -> str:
    if plot["status"] == "empty" or plot["status"] == "building":
        return plot["status"]
    
    if not plot.get("cropId") or not plot.get("plantedAt"):
        return "empty"
    
    crop_grow_times = {
        "wheat": 30,
        "carrot": 45,
        "tomato": 60,
        "corn": 90
    }
    
    crop_id = plot["cropId"]
    grow_time = crop_grow_times.get(crop_id, 60)
    elapsed = (int(time.time() * 1000) - plot["plantedAt"]) / 1000
    progress = elapsed / grow_time
    
    if progress >= 1:
        return "mature"
    if progress >= 0.66:
        return "growing"
    if progress >= 0.33:
        return "sprout"
    return "seed"


class PlantRequest(BaseModel):
    cropId: str
    userId: Optional[str] = None


class BuildRequest(BaseModel):
    buildingTypeId: str
    x: int
    y: int
    userId: Optional[str] = None


class FeedRequest(BaseModel):
    buildingId: str
    userId: Optional[str] = None


class CollectRequest(BaseModel):
    buildingId: str
    userId: Optional[str] = None


@router.get("")
async def get_plots():
    updated_plots = []
    for plot in plots_db.values():
        current_plot = plot.copy()
        current_plot["status"] = get_current_plot_status(plot)
        updated_plots.append(current_plot)
    return updated_plots


@router.get("/{plot_id}")
async def get_plot(plot_id: str):
    if plot_id not in plots_db:
        raise HTTPException(status_code=404, detail="地块不存在")
    
    plot = plots_db[plot_id].copy()
    plot["status"] = get_current_plot_status(plot)
    return plot


@router.post("/{plot_id}/plant")
async def plant_crop(plot_id: str, data: PlantRequest):
    if plot_id not in plots_db:
        raise HTTPException(status_code=404, detail="地块不存在")
    
    plot = plots_db[plot_id]
    current_status = get_current_plot_status(plot)
    
    if current_status != "empty":
        raise HTTPException(status_code=400, detail=f"该地块状态为 {current_status}，无法种植")
    
    crop_types = ["wheat", "carrot", "tomato", "corn"]
    if data.cropId not in crop_types:
        raise HTTPException(status_code=400, detail="无效的作物类型")
    
    plot["status"] = "seed"
    plot["cropId"] = data.cropId
    plot["plantedAt"] = int(time.time() * 1000)
    
    plots_db[plot_id] = plot
    save_to_file(plots_db, PLOTS_FILE)
    
    return plot


@router.post("/{plot_id}/harvest")
async def harvest_crop(plot_id: str):
    if plot_id not in plots_db:
        raise HTTPException(status_code=404, detail="地块不存在")
    
    plot = plots_db[plot_id]
    current_status = get_current_plot_status(plot)
    
    if current_status != "mature":
        raise HTTPException(status_code=400, detail=f"作物尚未成熟，当前状态: {current_status}")
    
    crop_id = plot.get("cropId")
    
    rewards = {
        "wheat": {"reward": 25, "cropId": "wheat"},
        "carrot": {"reward": 40, "cropId": "carrot"},
        "tomato": {"reward": 55, "cropId": "tomato"},
        "corn": {"reward": 70, "cropId": "corn"}
    }
    
    result = rewards.get(crop_id, {"reward": 20, "cropId": crop_id or "unknown"})
    
    plot["status"] = "empty"
    plot["cropId"] = None
    plot["plantedAt"] = None
    plot["buildingId"] = None
    
    plots_db[plot_id] = plot
    save_to_file(plots_db, PLOTS_FILE)
    
    return result


@router.post("/build")
async def build_structure(data: BuildRequest):
    building_id = f"building-{uuid.uuid4().hex[:8]}"
    building = {
        "id": building_id,
        "typeId": data.buildingTypeId,
        "x": data.x,
        "y": data.y
    }
    
    building_sizes = {
        "chicken": {"width": 2, "height": 2},
        "cow": {"width": 3, "height": 2},
        "sheep": {"width": 2, "height": 2}
    }
    
    size = building_sizes.get(data.buildingTypeId, {"width": 2, "height": 2})
    
    for dy in range(size["height"]):
        for dx in range(size["width"]):
            px = data.x + dx
            py = data.y + dy
            plot_id = f"plot-{px}-{py}"
            if plot_id in plots_db:
                plots_db[plot_id]["status"] = "building"
                plots_db[plot_id]["buildingId"] = building_id
                plots_db[plot_id]["cropId"] = None
                plots_db[plot_id]["plantedAt"] = None
    
    buildings_db[building_id] = building
    
    save_to_file(buildings_db, BUILDINGS_FILE)
    save_to_file(plots_db, PLOTS_FILE)
    
    return building


@router.get("/buildings")
async def get_buildings():
    return list(buildings_db.values())


@router.get("/buildings/{building_id}")
async def get_building(building_id: str):
    if building_id not in buildings_db:
        raise HTTPException(status_code=404, detail="建筑不存在")
    return buildings_db[building_id]


@router.get("/animals")
async def get_animals():
    updated_animals = []
    now = int(time.time() * 1000)
    for animal in animals_db.values():
        updated = animal.copy()
        time_since_fed = (now - animal["lastFed"]) / 60000
        health_decay = int(time_since_fed / 5)
        updated["health"] = max(0, min(100, animal["health"] - health_decay))
        updated_animals.append(updated)
    return updated_animals


@router.get("/buildings/{building_id}/animals")
async def get_animals_in_building(building_id: str):
    now = int(time.time() * 1000)
    result = []
    for animal in animals_db.values():
        if animal["buildingId"] == building_id:
            updated = animal.copy()
            time_since_fed = (now - animal["lastFed"]) / 60000
            health_decay = int(time_since_fed / 5)
            updated["health"] = max(0, min(100, animal["health"] - health_decay))
            result.append(updated)
    return result


@router.post("/animals/feed")
async def feed_animals(data: FeedRequest):
    if data.buildingId not in buildings_db:
        raise HTTPException(status_code=404, detail="建筑不存在")
    
    now = int(time.time() * 1000)
    fed_animals = []
    
    for animal_id, animal in animals_db.items():
        if animal["buildingId"] == data.buildingId:
            new_health = min(100, animal["health"] + 25)
            animal["health"] = new_health
            animal["lastFed"] = now
            animals_db[animal_id] = animal
            fed_animals.append(animal)
    
    save_to_file(animals_db, ANIMALS_FILE)
    return fed_animals


@router.post("/animals/collect")
async def collect_product(data: CollectRequest):
    if data.buildingId not in buildings_db:
        raise HTTPException(status_code=404, detail="建筑不存在")
    
    building = buildings_db[data.buildingId]
    now = int(time.time() * 1000)
    collected = 0
    
    building_types = {
        "chicken": "鸡蛋",
        "cow": "牛奶",
        "sheep": "羊毛"
    }
    product_name = building_types.get(building["typeId"], "产品")
    
    for animal_id, animal in animals_db.items():
        if animal["buildingId"] == data.buildingId and animal["productReadyAt"] <= now:
            animal["productReadyAt"] = now + 120000
            animals_db[animal_id] = animal
            collected += 1
    
    save_to_file(animals_db, ANIMALS_FILE)
    
    return {
        "product": product_name,
        "amount": collected,
        "buildingId": data.buildingId,
        "timestamp": now
    }


@router.post("/sync")
async def sync_all_data():
    now = int(time.time() * 1000)
    
    crop_grow_times = {
        "wheat": 30,
        "carrot": 45,
        "tomato": 60,
        "corn": 90
    }
    
    for plot_id, plot in plots_db.items():
        if plot.get("cropId") and plot.get("plantedAt"):
            crop_id = plot["cropId"]
            grow_time = crop_grow_times.get(crop_id, 60)
            elapsed = (now - plot["plantedAt"]) / 1000
            progress = elapsed / grow_time
            
            if progress >= 1:
                plot["status"] = "mature"
            elif progress >= 0.66:
                plot["status"] = "growing"
            elif progress >= 0.33:
                plot["status"] = "sprout"
            else:
                plot["status"] = "seed"
    
    for animal_id, animal in animals_db.items():
        time_since_fed = (now - animal["lastFed"]) / 60000
        health_decay = int(time_since_fed / 5)
        animal["health"] = max(0, min(100, animal["health"] - health_decay))
    
    save_to_file(plots_db, PLOTS_FILE)
    save_to_file(animals_db, ANIMALS_FILE)
    
    return {
        "status": "synced",
        "timestamp": now,
        "plots_count": len(plots_db),
        "animals_count": len(animals_db)
    }
