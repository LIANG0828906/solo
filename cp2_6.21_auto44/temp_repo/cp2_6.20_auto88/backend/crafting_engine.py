"""
================================================================
合成逻辑引擎模块 - crafting_engine.py
================================================================
职责: 实现装备合成的核心算法
  1. 材料组合兼容性计算
  2. 合成成功率概率算法 (>80%绿, 50-80%橙, <50%红)
  3. 属性加成计算方法

被调用方: main.py (FastAPI路由处理函数)
数据流:
  CraftingRequest(equipmentId + materialIds)
  -> calculate_preview() 返回 CraftingPreview
  -> execute_crafting()  使用成功率作为概率随机返回成功/失败

算法说明:
  成功率 = 基础70% + 稀有度加成均值 + 组合奖励
  属性增益 = Σ(材料属性值 × 稀有度倍率 × 风险因子)
  风险因子 = 1 - 成功率/200 (高风险高回报, 0.5-1.0)
================================================================
"""

from __future__ import annotations

import json
import random
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

# ============== 常量配置 ==============
BASE_SUCCESS_RATE: float = 70.0      # 基础成功率70%
MIN_SUCCESS_RATE: float = 10.0       # 最低10%
MAX_SUCCESS_RATE: float = 95.0       # 最高95%
THREE_SLOT_BONUS: float = 5.0        # 凑齐3槽+5%

# 稀有度配置: 倍率 + 成功率加成
RARITY_MULTIPLIER: dict[str, float] = {
    "common":    1.0,
    "uncommon":  1.2,
    "rare":      1.5,
    "epic":      2.0,
    "legendary": 3.0,
}

RARITY_BONUS: dict[str, float] = {
    "common":    0.0,
    "uncommon":  3.0,
    "rare":      6.0,
    "epic":     10.0,
    "legendary":15.0,
}

# 材料组合兼容性表: 特定ID组合 -> 额外成功率加成
COMPATIBILITY_BONUS: dict[tuple[str, ...], float] = {
    ("m1", "m2"): 2.0,            # 铁锭+皮革 = 基础装备
    ("m5", "m6"): 5.0,            # 秘银+魔晶核 = 魔法装备
    ("m7", "m8"): 8.0,            # 陨铁+龙魂石 = 龙系装备
    ("m9", "m10"): 10.0,          # 混沌+时之沙 = 神级装备
    ("m3", "m4"): 3.0,            # 翡翠+银矿 = 自然系
}

ATTR_KEYS = ("attack", "defense", "magic", "durability")

# ============== 数据加载 ==============
_DATA_PATH = Path(__file__).parent / "data" / "materials.json"


@dataclass
class _DB:
    materials: dict[str, dict[str, Any]]
    equipment: dict[str, dict[str, Any]]


def _load_data() -> _DB:
    """加载材料和装备JSON数据"""
    with open(_DATA_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    mats = {m["id"]: m for m in raw["materials"]}
    eqs = {e["id"]: e for e in raw["equipment"]}
    return _DB(materials=mats, equipment=eqs)


_DB = _load_data()


# ============== 对外工具函数 ==============
def get_all_materials() -> list[dict[str, Any]]:
    """返回所有材料列表 (GET /api/materials)"""
    return list(_DB.materials.values())


def get_all_equipment() -> list[dict[str, Any]]:
    """返回所有装备列表 (GET /api/equipment)"""
    return list(_DB.equipment.values())


def get_equipment_by_id(eq_id: str) -> dict[str, Any] | None:
    """根据ID获取装备 (GET /api/equipment/{id})"""
    return _DB.equipment.get(eq_id)


def get_material_by_id(mat_id: str) -> dict[str, Any] | None:
    return _DB.materials.get(mat_id)


def get_success_rate_color(rate: float) -> str:
    """
    根据成功率返回对应颜色名称
    >80% -> green, 50-80% -> orange, <50% -> red
    """
    if rate > 80:
        return "green"
    if rate >= 50:
        return "orange"
    return "red"


# ============== 核心算法 1: 成功率计算 ==============
def _calculate_compatibility_bonus(material_ids: list[str]) -> float:
    """
    材料组合兼容性奖励
    检测所有两两组合是否在COMPATIBILITY_BONUS表中
    """
    ids = set(material_ids)
    bonus = 0.0
    for key, value in COMPATIBILITY_BONUS.items():
        if set(key).issubset(ids):
            bonus += value
    return bonus


def calculate_success_rate(material_ids: list[str]) -> float:
    """
    合成成功率概率算法
    公式:
      稀有度加成 = Σ(各材料RARITY_BONUS) / 材料数
      兼容性加成 = Σ(匹配COMPATIBILITY_BONUS的组合)
      3槽奖励 = 3个材料满槽 +5%
      最终 = 70 + 稀有度加成 + 兼容性 + 3槽奖励
      裁剪到 [10, 95]
    """
    if not material_ids:
        return 0.0

    mats = [_DB.materials[mid] for mid in material_ids if mid in _DB.materials]
    if not mats:
        return BASE_SUCCESS_RATE

    rarity_bonus_total = sum(RARITY_BONUS.get(m["rarity"], 0) for m in mats)
    rarity_avg = rarity_bonus_total / len(mats)

    compat = _calculate_compatibility_bonus(material_ids)
    three_slot = THREE_SLOT_BONUS if len(material_ids) == 3 else 0.0

    rate = BASE_SUCCESS_RATE + rarity_avg + compat + three_slot
    return max(MIN_SUCCESS_RATE, min(MAX_SUCCESS_RATE, round(rate, 1)))


# ============== 核心算法 2: 属性加成计算 ==============
def calculate_attribute_diff(
    material_ids: list[str],
    success_rate: float,
) -> dict[str, float]:
    """
    属性加成计算方法
    风险因子 = 1 - 成功率/200 (成功率越低, 因子越高 -> 高风险高回报)
      10%成功率 -> 因子0.95 ; 95%成功率 -> 因子0.525
    最终增益 = round(材料属性值 × RARITY_MULTIPLIER × 风险因子)
    """
    risk_factor = 1.0 - (success_rate / 200.0)
    result: dict[str, float] = {k: 0 for k in ATTR_KEYS}

    for mid in material_ids:
        mat = _DB.materials.get(mid)
        if not mat:
            continue
        mult = RARITY_MULTIPLIER.get(mat["rarity"], 1.0)
        attrs: dict[str, int] = mat["attributes"]
        for k, v in attrs.items():
            gain = round(v * mult * risk_factor)
            result[k] = result.get(k, 0) + gain

    return result


# ============== 对外API: 预计算预览 ==============
def calculate_preview(equipment_id: str, material_ids: list[str]) -> dict[str, Any]:
    """
    预计算合成预览 - 实时展示用 (POST /api/crafting/calculate)
    返回: { successRate, estimatedAttributes, attributeDiff }
    性能要求: <200ms 响应
    """
    t0 = time.perf_counter()

    eq = _DB.equipment.get(equipment_id)
    if eq is None:
        raise ValueError(f"Equipment {equipment_id} not found")

    rate = calculate_success_rate(material_ids)
    diff = calculate_attribute_diff(material_ids, rate)

    base = eq["baseAttributes"]
    estimated = {k: base.get(k, 0) + diff.get(k, 0) for k in ATTR_KEYS}

    elapsed_ms = (time.perf_counter() - t0) * 1000
    print(f"[crafting_engine] preview calc took {elapsed_ms:.2f}ms")

    return {
        "successRate": rate,
        "estimatedAttributes": estimated,
        "attributeDiff": diff,
    }


# ============== 对外API: 执行合成 ==============
def execute_crafting(equipment_id: str, material_ids: list[str]) -> dict[str, Any]:
    """
    执行合成操作 - 带随机结果 (POST /api/crafting/execute)
    步骤:
      1) 预计算成功率和属性
      2) roll = random[0,100), roll <= successRate 则成功
      3) 成功 -> 使用估算新属性; 失败 -> 属性不变
      4) 收集材料颜色数组给前端做粒子特效
    """
    eq = _DB.equipment.get(equipment_id)
    if eq is None:
        raise ValueError(f"Equipment {equipment_id} not found")

    preview = calculate_preview(equipment_id, material_ids)
    rate: float = preview["successRate"]
    base = eq["baseAttributes"]

    roll = random.random() * 100.0
    success = roll <= rate

    mats = [_DB.materials[mid] for mid in material_ids if mid in _DB.materials]
    material_colors = [m["color"] for m in mats]

    if success:
        new_attrs = preview["estimatedAttributes"]
        diff = preview["attributeDiff"]
        message = _success_message(mats)
    else:
        new_attrs = {k: base.get(k, 0) for k in ATTR_KEYS}
        diff = {k: 0 for k in ATTR_KEYS}
        message = _fail_message(rate)

    return {
        "success": success,
        "successRate": rate,
        "originalAttributes": {k: base.get(k, 0) for k in ATTR_KEYS},
        "newAttributes": new_attrs,
        "attributeDiff": diff,
        "message": message,
        "materialColors": material_colors,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime()) + f".{int(time.time()*1000)%1000:03d}Z",
    }


# ============== 辅助: 结果消息生成 ==============
def _success_message(mats: list[dict[str, Any]]) -> str:
    rarities = {m["rarity"] for m in mats}
    if "legendary" in rarities:
        return "传说材料与装备完美融合，神器诞生！"
    if "epic" in rarities:
        return "史诗力量注入装备，散发夺目光芒！"
    if "rare" in rarities:
        return "合成成功！装备获得了显著的强化。"
    return "合成成功！装备获得了新的力量。"


def _fail_message(rate: float) -> str:
    if rate >= 80:
        return "尽管成功率很高，但合成意外失败了..."
    if rate >= 50:
        return "运气不佳，合成失败，材料消散。"
    return f"成功率仅{rate:.0f}%，失败在情理之中..."
