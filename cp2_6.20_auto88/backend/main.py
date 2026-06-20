"""
================================================================
FastAPI应用入口 - main.py
================================================================
职责:
  1. 定义RESTful API路由
  2. Pydantic数据验证
  3. 调用crafting_engine.py中的合成逻辑算法
  4. 配置CORS跨域 (允许前端Vite端口访问)

被调用: 前端 src/api/craftingApi.ts (Axios请求)
路由定义:
  GET  /api/materials              -> 材料列表
  GET  /api/equipment              -> 装备列表
  GET  /api/equipment/{id}         -> 装备详情
  POST /api/crafting/calculate     -> 预计算成功率+属性
  POST /api/crafting/execute       -> 执行合成(带随机)

运行: cd backend && python -m uvicorn main:app --reload --port 8000
================================================================
"""

from __future__ import annotations

from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import crafting_engine as engine


# ============ Pydantic 数据模型 ============
RarityType = Literal["common", "uncommon", "rare", "epic", "legendary"]
EquipmentType = Literal["weapon", "armor", "accessory"]
ModelType = Literal["sword", "shield", "staff"]


class MaterialAttributes(BaseModel):
    attack: int | None = None
    defense: int | None = None
    magic: int | None = None
    durability: int | None = None


class Material(BaseModel):
    id: str
    name: str
    rarity: RarityType
    attributes: MaterialAttributes
    color: str
    icon: str
    description: str


class BaseAttributes(BaseModel):
    attack: int
    defense: int
    magic: int
    durability: int


class Equipment(BaseModel):
    id: str
    name: str
    type: EquipmentType
    baseAttributes: BaseAttributes
    modelType: ModelType


class CraftingRequest(BaseModel):
    """合成请求: 装备ID + 材料ID列表 (1-3个)"""
    equipmentId: str
    materialIds: list[str] = Field(..., max_length=3, min_length=0)


class CraftingPreviewResponse(BaseModel):
    """预计算预览响应 - 实时展示用"""
    successRate: float = Field(..., ge=0, le=100)
    estimatedAttributes: dict[str, int | float]
    attributeDiff: dict[str, int | float]


class CraftingExecuteResponse(BaseModel):
    """合成执行结果响应 - 存入历史记录"""
    success: bool
    successRate: float
    originalAttributes: dict[str, int | float]
    newAttributes: dict[str, int | float]
    attributeDiff: dict[str, int | float]
    message: str
    materialColors: list[str]
    timestamp: str


# ============ FastAPI 应用 ============
app = FastAPI(
    title="装备合成模拟器 API",
    description="在线装备合成与属性模拟后端服务",
    version="1.0.0",
)

# CORS配置 - 允许前端Vite端口(5173)跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ 路由定义 ============
@app.get("/api/materials", response_model=list[Material], summary="获取材料列表")
def list_materials():
    """
    返回所有可用材料列表 (10-12种，按5档稀有度分类)
    被: CraftingPanel初始化时调用 -> MaterialCard渲染
    """
    return engine.get_all_materials()


@app.get("/api/equipment", response_model=list[Equipment], summary="获取装备列表")
def list_equipment():
    """返回所有可合成的基础装备列表"""
    return engine.get_all_equipment()


@app.get("/api/equipment/{eq_id}", response_model=Equipment, summary="获取装备详情")
def get_equipment(eq_id: str):
    """
    根据ID获取指定装备的详细信息
    404: 装备不存在
    """
    eq = engine.get_equipment_by_id(eq_id)
    if eq is None:
        raise HTTPException(status_code=404, detail=f"装备 {eq_id} 不存在")
    return eq


@app.post(
    "/api/crafting/calculate",
    response_model=CraftingPreviewResponse,
    summary="预计算合成预览",
    description="根据材料组合计算成功率和预估属性差值，响应<200ms",
)
def calculate_crafting(req: CraftingRequest):
    """
    预计算接口 - 前端实时预览用
    调用链: CraftingPanel槽位变化 -> useCrafting副作用
         -> craftingApi.calculateCraftingPreview -> 此处
         -> 返回CraftingPreview -> Zustand更新 -> 成功率/属性组件刷新
    """
    try:
        result = engine.calculate_preview(req.equipmentId, req.materialIds)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return CraftingPreviewResponse(**result)


@app.post(
    "/api/crafting/execute",
    response_model=CraftingExecuteResponse,
    summary="执行合成操作",
    description="根据成功率概率随机决定合成结果",
)
def execute_crafting(req: CraftingRequest):
    """
    合成执行接口 - 点击合成按钮时调用
    算法: random()*100 <= successRate 判定成功
    成功: 返回增强后的属性 + materialColors给3D粒子特效用
    失败: 属性不变，材料颜色数组仍然返回(用于失败红色粒子)
    """
    if not req.materialIds:
        raise HTTPException(status_code=400, detail="至少需要1种材料才能合成")
    try:
        result = engine.execute_crafting(req.equipmentId, req.materialIds)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return CraftingExecuteResponse(**result)


# ============ 健康检查 ============
@app.get("/health", tags=["系统"])
def health_check():
    return {
        "status": "ok",
        "service": "equipment-crafting-api",
        "materials_count": len(engine.get_all_materials()),
        "equipment_count": len(engine.get_all_equipment()),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
