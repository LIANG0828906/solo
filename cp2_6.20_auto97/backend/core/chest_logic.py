"""
核心开箱逻辑模块
实现宝箱开启算法、成功率计算、陷阱判定、物品掉落等核心功能
"""

import random
import math
from typing import Dict, List, Tuple, Optional

from .fragment_data import (
    FRAGMENT_TYPES,
    calculate_inscription_bonuses,
)


# ============== 宝箱类型基础配置 ==============
CHEST_CONFIGS: Dict[str, Dict] = {
    "iron_rune": {
        "name": "铁符文宝箱",
        "description": "普通的铁制符文宝箱，内含基础奖励",
        "tier": 1,
        # 基础成功率（不同开箱方式）
        "base_success_rates": {
            "magic_resonance": 70.0,    # 魔法共鸣：70%
            "mechanical_pick": 85.0,    # 机械撬开：85%
            "element_infusion": 60.0,   # 元素灌注：60%（高风险高回报）
        },
        # 基础陷阱触发概率
        "base_trap_chance": 20.0,
        # 陷阱基础伤害范围
        "trap_damage_range": [5, 15],
        # 基础碎片掉落数量范围
        "fragment_drop_range": [1, 3],
        # 物品奖励池（权重随机）
        "item_pool": [
            {"name": "小型生命药水", "type": "consumable", "rarity": "common", "weight": 30},
            {"name": "小型魔力药水", "type": "consumable", "rarity": "common", "weight": 25},
            {"name": "铁制护符", "type": "equipment", "rarity": "common", "weight": 15},
            {"name": "铜质钥匙", "type": "key", "rarity": "uncommon", "weight": 10},
            {"name": "神秘卷轴", "type": "scroll", "rarity": "uncommon", "weight": 8},
            {"name": "符文石", "type": "material", "rarity": "rare", "weight": 5},
            {"name": "古代地图碎片", "type": "treasure", "rarity": "rare", "weight": 4},
            {"name": "魔能核心", "type": "material", "rarity": "epic", "weight": 2},
            {"name": "龙鳞碎片", "type": "treasure", "rarity": "epic", "weight": 1},
        ],
        # 物品掉落数量范围
        "item_drop_range": [1, 2],
    },
    "crystal_seal": {
        "name": "水晶封印宝箱",
        "description": "被水晶封印的神秘宝箱，奖励更为丰厚",
        "tier": 2,
        "base_success_rates": {
            "magic_resonance": 55.0,
            "mechanical_pick": 65.0,
            "element_infusion": 50.0,
        },
        "base_trap_chance": 35.0,
        "trap_damage_range": [15, 35],
        "fragment_drop_range": [2, 5],
        "item_pool": [
            {"name": "中型生命药水", "type": "consumable", "rarity": "common", "weight": 20},
            {"name": "中型魔力药水", "type": "consumable", "rarity": "common", "weight": 18},
            {"name": "银制护符", "type": "equipment", "rarity": "uncommon", "weight": 15},
            {"name": "银质钥匙", "type": "key", "rarity": "uncommon", "weight": 12},
            {"name": "附魔卷轴", "type": "scroll", "rarity": "rare", "weight": 10},
            {"name": "精炼符文石", "type": "material", "rarity": "rare", "weight": 10},
            {"name": "稀有矿石", "type": "material", "rarity": "rare", "weight": 7},
            {"name": "高级魔能核心", "type": "material", "rarity": "epic", "weight": 5},
            {"name": "魔法水晶", "type": "treasure", "rarity": "epic", "weight": 2},
            {"name": "传奇装备碎片", "type": "treasure", "rarity": "legendary", "weight": 1},
        ],
        "item_drop_range": [1, 3],
    },
    "shadow_curse": {
        "name": "暗影诅咒宝箱",
        "description": "被黑暗诅咒笼罩的危险宝箱，高风险高回报",
        "tier": 3,
        "base_success_rates": {
            "magic_resonance": 40.0,
            "mechanical_pick": 35.0,
            "element_infusion": 45.0,
        },
        "base_trap_chance": 60.0,
        "trap_damage_range": [30, 80],
        "fragment_drop_range": [4, 8],
        "item_pool": [
            {"name": "大型生命药水", "type": "consumable", "rarity": "uncommon", "weight": 15},
            {"name": "大型魔力药水", "type": "consumable", "rarity": "uncommon", "weight": 13},
            {"name": "金制护符", "type": "equipment", "rarity": "rare", "weight": 12},
            {"name": "暗影钥匙", "type": "key", "rarity": "rare", "weight": 10},
            {"name": "诅咒卷轴", "type": "scroll", "rarity": "rare", "weight": 10},
            {"name": "暗影精华", "type": "material", "rarity": "epic", "weight": 12},
            {"name": "传说矿石", "type": "material", "rarity": "epic", "weight": 10},
            {"name": "顶级魔能核心", "type": "material", "rarity": "epic", "weight": 8},
            {"name": "神器碎片", "type": "treasure", "rarity": "legendary", "weight": 7},
            {"name": "远古法典", "type": "treasure", "rarity": "legendary", "weight": 3},
        ],
        "item_drop_range": [2, 4],
    },
}


# ============== 开箱方式特殊效果 ==============
OPEN_METHOD_EFFECTS: Dict[str, Dict] = {
    "magic_resonance": {
        "name": "魔法共鸣",
        "description": "使用魔法力量与宝箱共鸣，对魔法类宝箱有额外加成",
        # 与宝箱属性的匹配加成（属性克制/加成）
        "trap_multiplier": 1.0,
        "rare_chance_boost": 5.0,      # 稀有物品额外+5%概率
        "fragment_multiplier": 1.0,
    },
    "mechanical_pick": {
        "name": "机械撬开",
        "description": "使用工具强行撬开宝箱，对机械类宝箱效果较好",
        "trap_multiplier": 1.3,        # 陷阱伤害+30%（更容易触发机关）
        "rare_chance_boost": 0.0,
        "fragment_multiplier": 0.9,    # 碎片数量-10%（可能破坏部分内容）
    },
    "element_infusion": {
        "name": "元素灌注",
        "description": "注入元素力量开启宝箱，可能产生意想不到的效果",
        "trap_multiplier": 1.5,        # 陷阱伤害+50%（元素反应可能引爆陷阱）
        "rare_chance_boost": 15.0,     # 稀有物品额外+15%概率
        "fragment_multiplier": 1.5,    # 碎片数量+50%（元素能量凝结）
    },
}


# ============== 动画类型定义 ==============
ANIMATION_TYPES = {
    "success_normal": "success_normal",      # 普通成功
    "success_rare": "success_rare",          # 稀有成功（金光）
    "success_legendary": "success_legendary", # 传说成功（彩虹光）
    "fail_trap": "fail_trap",                # 失败陷阱
    "fail_destroy": "fail_destroy",          # 失败宝箱损坏
}


# ============== 核心算法函数 ==============

def _weighted_random_choice(item_pool: List[Dict], luck_boost: float = 0.0) -> Dict:
    """
    基于权重的随机选择（带幸运加成）
    
    Args:
        item_pool: 物品池，每项含weight权重
        luck_boost: 幸运加成百分比，会提升稀有物品权重
    
    Returns:
        选中的物品字典
    """
    # 稀有度权重调整系数
    rarity_boost_map = {
        "common": 1.0,
        "uncommon": 1.0 + luck_boost * 0.005,
        "rare": 1.0 + luck_boost * 0.015,
        "epic": 1.0 + luck_boost * 0.03,
        "legendary": 1.0 + luck_boost * 0.05,
    }

    adjusted_pool = []
    for item in item_pool:
        rarity = item.get("rarity", "common")
        boost = rarity_boost_map.get(rarity, 1.0)
        adjusted_weight = item["weight"] * boost
        adjusted_pool.append((item, adjusted_weight))

    total_weight = sum(w for _, w in adjusted_pool)
    rand_val = random.uniform(0, total_weight)

    cumulative = 0.0
    for item, weight in adjusted_pool:
        cumulative += weight
        if rand_val <= cumulative:
            return item

    # 兜底返回第一个
    return adjusted_pool[0][0]


def _calculate_success_rate(
    chest_type: str,
    open_method: str,
    bonuses: Dict[str, float],
) -> float:
    """
    计算最终开箱成功率
    
    Args:
        chest_type: 宝箱类型
        open_method: 开箱方式
        bonuses: 铭文综合加成
    
    Returns:
        最终成功率（0-100）
    """
    config = CHEST_CONFIGS.get(chest_type)
    if not config:
        return 0.0

    base_rate = config["base_success_rates"].get(open_method, 50.0)

    # 铭文成功率加成
    success_boost = bonuses.get("success_boost", 0.0)
    # 综合幸运加成（按一半比例折算成功率）
    luck_boost = bonuses.get("luck_boost", 0.0) * 0.5

    final_rate = base_rate + success_boost + luck_boost

    # 限制在合理范围（5% ~ 98%）
    final_rate = max(5.0, min(final_rate, 98.0))

    return final_rate


def _calculate_trap_chance(
    chest_type: str,
    open_method: str,
    bonuses: Dict[str, float],
) -> float:
    """
    计算陷阱触发概率
    
    Args:
        chest_type: 宝箱类型
        open_method: 开箱方式
        bonuses: 铭文综合加成
    
    Returns:
        陷阱触发概率（0-100）
    """
    config = CHEST_CONFIGS.get(chest_type)
    if not config:
        return 0.0

    base_chance = config["base_trap_chance"]

    # 综合幸运加成减少陷阱概率（每2%幸运减1%陷阱）
    luck_reduction = bonuses.get("luck_boost", 0.0) * 0.5

    final_chance = base_chance - luck_reduction

    # 限制在5% ~ 90%
    final_chance = max(5.0, min(final_chance, 90.0))

    return final_chance


def _calculate_trap_damage(
    chest_type: str,
    open_method: str,
    bonuses: Dict[str, float],
) -> int:
    """
    计算陷阱实际造成的伤害
    
    Args:
        chest_type: 宝箱类型
        open_method: 开箱方式
        bonuses: 铭文综合加成
    
    Returns:
        最终伤害值
    """
    config = CHEST_CONFIGS.get(chest_type)
    if not config:
        return 0

    method_effects = OPEN_METHOD_EFFECTS.get(open_method, {})
    trap_multiplier = method_effects.get("trap_multiplier", 1.0)
    trap_reduction = bonuses.get("trap_reduction", 0.0)

    dmg_min, dmg_max = config["trap_damage_range"]
    base_damage = random.randint(dmg_min, dmg_max)

    # 先乘开箱方式系数，再减伤（百分比）
    final_damage = base_damage * trap_multiplier * (1.0 - trap_reduction / 100.0)

    return max(0, int(math.ceil(final_damage)))


def _drop_fragments(
    chest_type: str,
    open_method: str,
    bonuses: Dict[str, float],
) -> List[Dict]:
    """
    随机掉落碎片
    
    Args:
        chest_type: 宝箱类型
        open_method: 开箱方式
        bonuses: 铭文综合加成
    
    Returns:
        碎片列表 [{type, amount}, ...]
    """
    config = CHEST_CONFIGS.get(chest_type)
    if not config:
        return []

    method_effects = OPEN_METHOD_EFFECTS.get(open_method, {})
    fragment_multiplier = method_effects.get("fragment_multiplier", 1.0)
    fragment_bonus = bonuses.get("fragment_bonus", 0)
    luck_boost = bonuses.get("luck_boost", 0.0)

    f_min, f_max = config["fragment_drop_range"]
    base_count = random.randint(f_min, f_max)

    # 综合数量计算
    total_count = int(base_count * fragment_multiplier) + fragment_bonus

    # 幸运加成有概率额外+1
    if random.random() < luck_boost / 100.0:
        total_count += 1

    # 最少1个
    total_count = max(1, total_count)

    # 随机分配到各属性（基于均匀分布）
    fragments: Dict[str, int] = {}
    for _ in range(total_count):
        frag_type = random.choice(FRAGMENT_TYPES)
        fragments[frag_type] = fragments.get(frag_type, 0) + 1

    # 转为列表格式
    result = [{"type": ftype, "amount": amount} for ftype, amount in fragments.items()]

    return result


def _drop_items(
    chest_type: str,
    bonuses: Dict[str, float],
) -> List[Dict]:
    """
    随机掉落物品
    
    Args:
        chest_type: 宝箱类型
        bonuses: 铭文综合加成
    
    Returns:
        掉落物品列表
    """
    config = CHEST_CONFIGS.get(chest_type)
    if not config:
        return []

    i_min, i_max = config["item_drop_range"]
    drop_count = random.randint(i_min, i_max)

    # 稀有物品概率加成
    rare_chance_boost = bonuses.get("rare_chance", 0.0)
    # 幸运加成（折算为稀有加成）
    luck_based_rare = bonuses.get("luck_boost", 0.0) * 0.3
    total_rare_boost = rare_chance_boost + luck_based_rare

    dropped_items = []
    for _ in range(drop_count):
        item = _weighted_random_choice(config["item_pool"], total_rare_boost)
        dropped_items.append(dict(item))

    return dropped_items


def _determine_animation(
    success: bool,
    items: List[Dict],
    trap_triggered: bool,
) -> str:
    """
    根据开箱结果决定动画类型
    
    Args:
        success: 是否成功开启
        items: 掉落物品列表
        trap_triggered: 是否触发陷阱
    
    Returns:
        动画类型字符串
    """
    if not success:
        if trap_triggered:
            return ANIMATION_TYPES["fail_trap"]
        return ANIMATION_TYPES["fail_destroy"]

    # 检查最高稀有度
    max_rarity = "common"
    rarity_order = {"common": 0, "uncommon": 1, "rare": 2, "epic": 3, "legendary": 4}
    for item in items:
        rarity = item.get("rarity", "common")
        if rarity_order.get(rarity, 0) > rarity_order.get(max_rarity, 0):
            max_rarity = rarity

    if max_rarity == "legendary":
        return ANIMATION_TYPES["success_legendary"]
    elif max_rarity in ("epic", "rare"):
        return ANIMATION_TYPES["success_rare"]
    else:
        return ANIMATION_TYPES["success_normal"]


# ============== 对外公开接口 ==============

def open_chest(
    chest_type: str,
    open_method: str,
    inscriptions: Optional[List[Dict]] = None,
) -> Dict:
    """
    执行开箱操作（核心入口函数）
    
    Args:
        chest_type: 宝箱类型 (iron_rune/crystal_seal/shadow_curse)
        open_method: 开箱方式 (magic_resonance/mechanical_pick/element_infusion)
        inscriptions: 铭文加成列表 [{"type": "fire", "level": 5}, ...]
    
    Returns:
        开箱结果字典:
        {
            "success": bool,              # 是否成功开启
            "damage": int,                # 受到的伤害（0表示无伤害）
            "items": list,                # 掉落物品列表
            "fragments": list,            # 掉落碎片列表
            "message": str,               # 结果消息
            "animation_type": str,        # 推荐动画类型
            "chest_info": dict,           # 宝箱信息
            "method_info": dict,          # 开箱方式信息
            "stats": dict,                # 本次开箱的数值统计（便于调试）
        }
    """
    # 验证参数合法性
    if chest_type not in CHEST_CONFIGS:
        return {
            "success": False,
            "damage": 0,
            "items": [],
            "fragments": [],
            "message": f"未知的宝箱类型: {chest_type}",
            "animation_type": ANIMATION_TYPES["fail_destroy"],
            "chest_info": {},
            "method_info": {},
            "stats": {},
        }

    if open_method not in OPEN_METHOD_EFFECTS:
        return {
            "success": False,
            "damage": 0,
            "items": [],
            "fragments": [],
            "message": f"未知的开箱方式: {open_method}",
            "animation_type": ANIMATION_TYPES["fail_destroy"],
            "chest_info": {},
            "method_info": {},
            "stats": {},
        }

    if inscriptions is None:
        inscriptions = []

    # 计算铭文综合加成
    bonuses = calculate_inscription_bonuses(inscriptions)

    # 宝箱配置
    chest_config = CHEST_CONFIGS[chest_type]
    method_config = OPEN_METHOD_EFFECTS[open_method]

    # 开箱方式的稀有加成也计入
    bonuses["rare_chance"] = bonuses.get("rare_chance", 0.0) + method_config.get("rare_chance_boost", 0.0)

    # 计算成功率并判定
    success_rate = _calculate_success_rate(chest_type, open_method, bonuses)
    roll_success = random.uniform(0, 100) < success_rate

    # 计算陷阱概率并判定（无论成功与否都可能触发）
    trap_chance = _calculate_trap_chance(chest_type, open_method, bonuses)
    trap_triggered = random.uniform(0, 100) < trap_chance

    # 计算伤害（仅当陷阱触发时）
    damage = 0
    if trap_triggered:
        damage = _calculate_trap_damage(chest_type, open_method, bonuses)

    # 计算奖励（仅当成功时）
    items = []
    fragments = []
    if roll_success:
        items = _drop_items(chest_type, bonuses)
        fragments = _drop_fragments(chest_type, open_method, bonuses)

    # 构造消息
    if roll_success and not trap_triggered:
        msg = f"成功开启{chest_config['name']}！获得了丰厚的奖励。"
    elif roll_success and trap_triggered:
        msg = f"成功开启{chest_config['name']}，但触发了陷阱，受到{damage}点伤害。"
    elif not roll_success and trap_triggered:
        msg = f"开启{chest_config['name']}失败，触发了陷阱，受到{damage}点伤害！"
    else:
        msg = f"开启{chest_config['name']}失败，宝箱已自毁。"

    # 决定动画类型
    animation_type = _determine_animation(roll_success, items, trap_triggered)

    # 统计信息
    stats = {
        "success_rate": round(success_rate, 2),
        "trap_chance": round(trap_chance, 2),
        "applied_bonuses": bonuses,
    }

    return {
        "success": roll_success,
        "damage": damage,
        "items": items,
        "fragments": fragments,
        "message": msg,
        "animation_type": animation_type,
        "chest_info": {
            "type": chest_type,
            "name": chest_config["name"],
            "tier": chest_config["tier"],
        },
        "method_info": {
            "type": open_method,
            "name": method_config["name"],
        },
        "stats": stats,
    }


def get_chest_config(chest_type: Optional[str] = None) -> Dict:
    """
    获取宝箱配置信息
    
    Args:
        chest_type: 指定宝箱类型，None则返回全部
    
    Returns:
        宝箱配置字典
    """
    if chest_type:
        config = CHEST_CONFIGS.get(chest_type)
        if config:
            return {chest_type: config}
        return {}
    return CHEST_CONFIGS


def get_open_method_config(method_type: Optional[str] = None) -> Dict:
    """
    获取开箱方式配置
    
    Args:
        method_type: 指定开箱方式，None则返回全部
    
    Returns:
        开箱方式配置字典
    """
    if method_type:
        config = OPEN_METHOD_EFFECTS.get(method_type)
        if config:
            return {method_type: config}
        return {}
    return OPEN_METHOD_EFFECTS
