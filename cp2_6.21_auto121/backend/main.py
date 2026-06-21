from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
import json
import os
import uuid

from models import Furniture, Style, DesignSaveRequest, DesignResponse, PriceResponse, FurnitureItem
from data import furniture_data, style_data, get_furniture_by_id, get_style_by_id

app = FastAPI(title="家居设计API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DESIGNS_FILE = os.path.join(DATA_DIR, "designs.json")

os.makedirs(DATA_DIR, exist_ok=True)

if not os.path.exists(DESIGNS_FILE):
    with open(DESIGNS_FILE, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=2)


def load_designs():
    try:
        with open(DESIGNS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def save_designs(designs):
    with open(DESIGNS_FILE, "w", encoding="utf-8") as f:
        json.dump(designs, f, ensure_ascii=False, indent=2, default=str)


def calculate_total_price(furniture_items: List[FurnitureItem]) -> float:
    total = 0.0
    for item in furniture_items:
        furniture = get_furniture_by_id(item.furniture_id)
        if furniture:
            total += furniture.price
    return round(total, 2)


@app.get("/api/furniture", response_model=List[Furniture], summary="获取所有家具列表")
async def get_furniture(category: Optional[str] = None):
    if category:
        return [f for f in furniture_data if f.category == category]
    return furniture_data


@app.get("/api/styles", response_model=List[Style], summary="获取所有风格列表")
async def get_styles():
    return style_data


@app.get("/api/furniture/prices", response_model=PriceResponse, summary="根据ID批量获取家具价格")
async def get_prices(ids: str = Query(..., description="家具ID列表，逗号分隔")):
    try:
        id_list = [int(i.strip()) for i in ids.split(",") if i.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="ID格式错误，应为逗号分隔的数字")
    
    prices = {}
    for fid in id_list:
        furniture = get_furniture_by_id(fid)
        if furniture:
            prices[fid] = furniture.price
    return {"prices": prices}


@app.post("/api/designs", response_model=DesignResponse, summary="保存设计方案")
async def save_design(design_request: DesignSaveRequest):
    style = get_style_by_id(design_request.style_id)
    if not style:
        raise HTTPException(status_code=404, detail=f"风格ID {design_request.style_id} 不存在")
    
    for item in design_request.furniture_items:
        if not get_furniture_by_id(item.furniture_id):
            raise HTTPException(status_code=404, detail=f"家具ID {item.furniture_id} 不存在")
    
    designs = load_designs()
    now = datetime.now()
    design_id = str(uuid.uuid4())
    
    total_price = calculate_total_price(design_request.furniture_items)
    
    design_dict = {
        "id": design_id,
        "name": design_request.name,
        "style_id": design_request.style_id,
        "style_name": style.name,
        "room_width": design_request.room_width,
        "room_height": design_request.room_height,
        "furniture_items": [item.dict() for item in design_request.furniture_items],
        "total_price": total_price,
        "description": design_request.description,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    designs.append(design_dict)
    save_designs(designs)
    
    return DesignResponse(**design_dict)


@app.get("/api/designs", response_model=List[DesignResponse], summary="获取已保存的设计方案列表")
async def get_designs():
    designs = load_designs()
    result = []
    for d in designs:
        d["created_at"] = datetime.fromisoformat(d["created_at"])
        d["updated_at"] = datetime.fromisoformat(d["updated_at"])
        result.append(DesignResponse(**d))
    return result


@app.get("/api/designs/{design_id}", response_model=DesignResponse, summary="获取单个设计详情")
async def get_design(design_id: str):
    designs = load_designs()
    for d in designs:
        if d["id"] == design_id:
            d["created_at"] = datetime.fromisoformat(d["created_at"])
            d["updated_at"] = datetime.fromisoformat(d["updated_at"])
            return DesignResponse(**d)
    raise HTTPException(status_code=404, detail=f"设计方案ID {design_id} 不存在")


@app.delete("/api/designs/{design_id}", summary="删除设计方案")
async def delete_design(design_id: str):
    designs = load_designs()
    for i, d in enumerate(designs):
        if d["id"] == design_id:
            designs.pop(i)
            save_designs(designs)
            return {"message": "删除成功", "id": design_id}
    raise HTTPException(status_code=404, detail=f"设计方案ID {design_id} 不存在")


@app.get("/", summary="根路径")
async def root():
    return {
        "message": "家居设计API服务运行中",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "GET /api/furniture": "获取家具列表",
            "GET /api/styles": "获取风格列表",
            "GET /api/furniture/prices?ids=1,2,3": "获取家具价格",
            "POST /api/designs": "保存设计方案",
            "GET /api/designs": "获取设计方案列表",
            "GET /api/designs/{id}": "获取设计详情",
            "DELETE /api/designs/{id}": "删除设计方案"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
