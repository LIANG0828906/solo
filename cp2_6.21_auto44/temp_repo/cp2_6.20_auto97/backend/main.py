"""
FastAPI后端入口
实现开箱系统的RESTful API接口
"""

from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from core.chest_logic import (
    open_chest,
    get_chest_config,
    get_open_method_config,
)
from core.fragment_data import (
    get_all_fragments,
    get_fragment_info,
    get_all_synthesis_recipes,
    get_inscription_effects,
    calculate_inscription_bonuses,
)


# ============== FastAPI应用初始化 ==============
app = FastAPI(
    title="法器开箱系统 API",
    description="基于铭文与法器碎片的开箱系统后端接口",
    version="1.0.0",
)

# ============== CORS中间件配置（允许所有来源） ==============
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # 允许所有来源
    allow_credentials=True,
    allow_methods=["*"],           # 允许所有HTTP方法
    allow_headers=["*"],           # 允许所有请求头
)


# ============== 请求/响应数据模型 ==============

class InscriptionItem(BaseModel):
    """铭文数据模型"""
    type: str = Field(..., description="铭文属性类型: fire/ice/thunder/shadow/holy")
    level: int = Field(..., ge=1, le=10, description="铭文等级 (1-10)")


class OpenChestRequest(BaseModel):
    """开箱请求数据模型"""
    chest_type: str = Field(..., description="宝箱类型: iron_rune/crystal_seal/shadow_curse")
    open_method: str = Field(..., description="开箱方式: magic_resonance/mechanical_pick/element_infusion")
    inscriptions: Optional[List[InscriptionItem]] = Field(
        default=[], description="铭文加成数组，可选"
    )


# ============== API接口定义 ==============

@app.get("/", tags=["根路径"])
async def root():
    """
    根路径，返回API基本信息
    """
    return {
        "name": "法器开箱系统 API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "POST /api/open-chest": "执行开箱操作",
            "GET /api/fragments": "获取法器碎片与铭文数据",
            "GET /api/chests": "获取宝箱配置信息",
            "GET /api/open-methods": "获取开箱方式配置",
        },
    }


@app.post("/api/open-chest", tags=["开箱系统"])
async def api_open_chest(request: OpenChestRequest):
    """
    执行开箱操作
    
    - **chest_type**: 宝箱类型（iron_rune铁符文 / crystal_seal水晶封印 / shadow_curse暗影诅咒）
    - **open_method**: 开箱方式（magic_resonance魔法共鸣 / mechanical_pick机械撬开 / element_infusion元素灌注）
    - **inscriptions**: 铭文加成数组，可选，每项包含 type 和 level
    
    返回结果包含：
    - **success**: 是否成功开启
    - **damage**: 受到的伤害（0表示无伤害）
    - **items**: 掉落物品列表
    - **fragments**: 掉落碎片列表
    - **message**: 结果消息
    - **animation_type**: 推荐动画类型
    """
    # 将Pydantic模型转换为字典
    inscriptions_list = []
    if request.inscriptions:
        inscriptions_list = [ins.dict() for ins in request.inscriptions]

    # 执行开箱逻辑
    result = open_chest(
        chest_type=request.chest_type,
        open_method=request.open_method,
        inscriptions=inscriptions_list,
    )

    # 检查是否为参数错误（未知宝箱或方式）
    if not result["success"] and not result["chest_info"]:
        raise HTTPException(status_code=400, detail=result["message"])

    return result


@app.get("/api/fragments", tags=["碎片与铭文"])
async def api_get_fragments():
    """
    获取法器碎片与铭文相关数据
    
    返回内容：
    - **fragments**: 5种属性碎片的详细信息（火/冰/雷/暗/光）
    - **inscriptions**: 各属性铭文的加成效果定义
    - **synthesis_recipes**: 碎片合成配方表（基础/中级/高级）
    """
    return {
        "fragments": get_all_fragments(),
        "inscriptions": {
            k: {
                "name": v["name"],
                "max_level": v["max_level"],
                "description": v["description"],
                "base_effects": v["base_effects"],
            }
            for k, v in get_all_fragments().items()
            if k in ["fire", "ice", "thunder", "shadow", "holy"]
        },
        "synthesis_recipes": get_all_synthesis_recipes(),
    }


@app.get("/api/fragments/{fragment_type}", tags=["碎片与铭文"])
async def api_get_fragment_detail(fragment_type: str):
    """
    获取指定属性碎片的详细信息
    
    - **fragment_type**: 碎片类型 (fire/ice/thunder/shadow/holy)
    """
    info = get_fragment_info(fragment_type)
    if not info:
        raise HTTPException(status_code=404, detail=f"未知的碎片类型: {fragment_type}")

    inscription_info = get_inscription_effects(fragment_type)

    return {
        "fragment": info,
        "inscription": inscription_info,
    }


@app.get("/api/chests", tags=["配置信息"])
async def api_get_chests():
    """
    获取所有宝箱类型的配置信息
    """
    configs = get_chest_config()
    # 清理返回数据，移除过大的item_pool原始数据中的冗余字段（可选）
    return {
        "chests": configs,
    }


@app.get("/api/chests/{chest_type}", tags=["配置信息"])
async def api_get_chest_detail(chest_type: str):
    """
    获取指定宝箱类型的配置信息
    
    - **chest_type**: 宝箱类型 (iron_rune/crystal_seal/shadow_curse)
    """
    configs = get_chest_config(chest_type)
    if not configs:
        raise HTTPException(status_code=404, detail=f"未知的宝箱类型: {chest_type}")
    return configs


@app.get("/api/open-methods", tags=["配置信息"])
async def api_get_open_methods():
    """
    获取所有开箱方式的配置信息
    """
    return {
        "open_methods": get_open_method_config(),
    }


@app.post("/api/calculate-bonuses", tags=["工具接口"])
async def api_calculate_bonuses(inscriptions: List[InscriptionItem]):
    """
    计算铭文列表的综合加成效果（预览工具）
    
    输入铭文数组，返回综合加成数值
    """
    ins_list = [ins.dict() for ins in inscriptions]
    bonuses = calculate_inscription_bonuses(ins_list)
    return {
        "inscriptions": ins_list,
        "total_bonuses": bonuses,
    }


# ============== 应用启动入口（开发调试用） ==============
if __name__ == "__main__":
    import uvicorn
    # 启动开发服务器，默认监听 0.0.0.0:8000
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
