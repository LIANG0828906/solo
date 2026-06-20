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
# 所有宝箱共享统一的基础成功率，开箱方式提供加成/减益
CHEST_CONFIGS: Dict[str, Dict] = {
    "iron_rune": {
        "name": "铁符文宝箱",
        "description": "普通的铁制符文宝箱，内含基础奖励",
        "tier": 1,
        "level": 1,
        # 基础成功率（所有宝箱统一基数，开箱方式提供加成）
        "base_success_rate": 75.0,
        # 基础陷阱触发概率
        "base_trap_chance": 15.0,
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
        "level": 2,
        "base_success_rate": 60.0,
        "base_trap_chance": 30.0,
        "trap_damage_range": [15, 30],
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
        "level": 3,
        "base_success_rate": 40.0,
        "base_trap_chance": 55.0,
        "trap_damage_range": [30, 60],
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
# 严格按照三种定位设计数值
OPEN_METHOD_EFFECTS: Dict[str, Dict] = {
    "magic_resonance": {
        "name": "魔法共鸣",
        "description": "使用魔法力量与宝箱共鸣，温和地破解宝箱封印",
        # 成功率加成（百分比）：+15% 对所有宝箱
        "success_rate_boost": 15.0,
        # 陷阱概率变化（百分比）：-10% 降低陷阱触发
        "trap_chance_modifier": -10.0,
        # 陷阱伤害系数（乘法）：1.0 基础伤害不变
        "trap_damage_multiplier": 1.0,
        # 稀有掉落概率变化（百分比）：+3%
        "rare_drop_modifier": 3.0,
        # 碎片掉落系数（乘法）：1.0 不变
        "fragment_multiplier": 1.0,
        # 失败惩罚系数（乘法）：1.0 基础伤害不变
        "fail_penalty_multiplier": 1.0,
    },
    "mechanical_pick": {
        "name": "机械撬锁",
        "description": "使用工具强行撬开宝箱，擅长规避但可能破坏稀有物品",
        # 成功率加成（百分比）：+5%
        "success_rate_boost": 5.0,
        # 陷阱概率变化（百分比）：-25% 大幅降低陷阱触发
        "trap_chance_modifier": -25.0,
        # 陷阱伤害系数（乘法）：0.6 即-40%减伤
        "trap_damage_multiplier": 0.6,
        # 稀有掉落概率变化（百分比）：-5% 强行撬锁可能破坏稀有物品
        "rare_drop_modifier": -5.0,
        # 碎片掉落系数（乘法）：1.0 不变
        "fragment_multiplier": 1.0,
        # 失败惩罚系数（乘法）：0.7 即-30%扣血
        "fail_penalty_multiplier": 0.7,
    },
    "element_infusion": {
        "name": "元素注入",
        "description": "注入元素力量开启宝箱，高风险高回报——成功率看似正常，但失败代价极其惨重",
        # 成功率加成（百分比）：0% 保持正常成功率（不再人为降低）
        "success_rate_boost": 0.0,
        # 陷阱概率变化（百分比）：+20% 更高风险
        "trap_chance_modifier": 20.0,
        # 陷阱伤害系数（乘法）：1.5 即+50%伤害
        "trap_damage_multiplier": 1.5,
        # 稀有掉落概率变化（百分比）：+20% 大幅提升
        "rare_drop_modifier": 20.0,
        # 碎片掉落系数（乘法）：1.5 即+50%
        "fragment_multiplier": 1.5,
        # 失败惩罚系数（乘法）：1.5 即+50%扣血
        "fail_penalty_multiplier": 1.5,
        # 元素注入失败时额外惩罚倍率（仅 element_infusion 生效）
        "element_fail_extra_penalty": 2.0,
        # 元素注入失败时额外陷阱概率（仅 element_infusion 生效，且仅在失败时判定）
        "element_trap_extra_chance": 15.0,
    },
}


# ============== 陷阱类型配置 ==============
TRAP_TYPES: List[Dict] = [
    {
        "id": "poison_mist",
        "name": "毒雾陷阱",
        "description": "释放毒雾，造成持续伤害",
        "damage_multiplier": 0.8,
        "special_effect": "持续扣血",
    },
    {
        "id": "lightning",
        "name": "闪电陷阱",
        "description": "触发雷击，造成高额伤害",
        "damage_multiplier": 1.3,
        "special_effect": "高伤害",
    },
    {
        "id": "spike",
        "name": "地刺陷阱",
        "description": "地面伸出尖刺，造成中等伤害",
        "damage_multiplier": 1.0,
        "special_effect": "中等伤害",
    },
]


# ============== 动画类型定义 ==============
ANIMATION_TYPES = {
    "success_normal": "success_normal",
    "success_rare": "success_rare",
    "success_legendary": "success_legendary",
    "fail_trap": "fail_trap",
    "fail_destroy": "fail_destroy",
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

    return adjusted_pool[0][0]


def _calculate_success_rate(
    chest_type: str,
    open_method: str,
    bonuses: Dict[str, float],
) -> float:
    """
    计算最终开箱成功率
    
    算法：基础成功率 + 开箱方式加成 + 铭文成功率加成 + 幸运折算加成
    
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

    method_effects = OPEN_METHOD_EFFECTS.get(open_method, {})

    # 1. 基础成功率（宝箱本身的难度）
    base_rate = config["base_success_rate"]

    # 2. 开箱方式的成功率加成
    method_boost = method_effects.get("success_rate_boost", 0.0)

    # 3. 铭文成功率加成
    inscription_boost = bonuses.get("success_boost", 0.0)

    # 4. 幸运加成（按一半比例折算成功率）
    luck_boost = bonuses.get("luck_boost", 0.0) * 0.5

    # 汇总计算
    final_rate = base_rate + method_boost + inscription_boost + luck_boost

    # 限制在合理范围（5% ~ 98%，永远有成功和失败的可能）
    final_rate = max(5.0, min(final_rate, 98.0))

    return final_rate


def _calculate_trap_chance(
    chest_type: str,
    open_method: str,
    bonuses: Dict[str, float],
) -> float:
    """
    计算陷阱触发概率
    
    算法：基础陷阱率 + 开箱方式修正 + 幸运减益
    
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

    method_effects = OPEN_METHOD_EFFECTS.get(open_method, {})

    # 1. 基础陷阱概率
    base_chance = config["base_trap_chance"]

    # 2. 开箱方式的陷阱概率修正（正为增加，负为减少）
    method_modifier = method_effects.get("trap_chance_modifier", 0.0)

    # 3. 幸运加成减少陷阱概率（每2%幸运减1%陷阱）
    luck_reduction = bonuses.get("luck_boost", 0.0) * 0.5

    # 汇总计算
    final_chance = base_chance + method_modifier - luck_reduction

    # 限制在5% ~ 90%（陷阱永远有触发和不触发的可能）
    final_chance = max(5.0, min(final_chance, 90.0))

    return final_chance


def _calculate_trap_damage(
    chest_type: str,
    open_method: str,
    bonuses: Dict[str, float],
    is_failure: bool = False,
) -> Tuple[int, Dict]:
    """
    计算陷阱实际造成的伤害，并确定陷阱类型
    
    算法：
    - 随机抽取基础伤害值
    - 随机选择陷阱类型（影响伤害系数）
    - 应用开箱方式的伤害系数
    - 应用铭文减伤
    - 如果是失败触发陷阱，额外应用失败惩罚系数
    
    Args:
        chest_type: 宝箱类型
        open_method: 开箱方式
        bonuses: 铭文综合加成
        is_failure: 是否为开箱失败时触发的陷阱
    
    Returns:
        (最终伤害值, 陷阱类型信息字典)
    """
    config = CHEST_CONFIGS.get(chest_type)
    if not config:
        return 0, {}

    method_effects = OPEN_METHOD_EFFECTS.get(open_method, {})

    # 1. 随机抽取基础伤害
    dmg_min, dmg_max = config["trap_damage_range"]
    base_damage = random.randint(dmg_min, dmg_max)

    # 2. 随机选择陷阱类型
    trap_type = random.choice(TRAP_TYPES)
    trap_damage_multiplier = trap_type["damage_multiplier"]

    # 3. 应用开箱方式的陷阱伤害系数
    method_damage_multiplier = method_effects.get("trap_damage_multiplier", 1.0)

    # 4. 铭文减伤（百分比）
    trap_reduction = bonuses.get("trap_reduction", 0.0)

    # 5. 如果是失败触发，应用失败惩罚系数
    fail_penalty_multiplier = 1.0
    if is_failure:
        fail_penalty_multiplier = method_effects.get("fail_penalty_multiplier", 1.0)

    # 汇总计算：先乘系数，再减伤
    final_damage = base_damage * trap_damage_multiplier * method_damage_multiplier
    final_damage = final_damage * (1.0 - trap_reduction / 100.0)
    final_damage = final_damage * fail_penalty_multiplier

    # 向上取整，确保至少1点伤害
    final_damage = max(1, int(math.ceil(final_damage)))

    return final_damage, trap_type


def _calculate_fail_penalty(
    chest_type: str,
    open_method: str,
) -> int:
    """
    计算开箱失败但未触发陷阱时的惩罚伤害
    
    规则：
    - 失败但未触发陷阱：扣血 = 宝箱等级 × 2 × 失败惩罚系数 × 元素额外惩罚倍率
    - 宝箱等级：铁=1，水晶=2，暗影=3 → 对应扣血 2/4/6 基础值
    - 元素注入：额外乘以 element_fail_extra_penalty（2.0），惩罚翻倍
    
    Args:
        chest_type: 宝箱类型
        open_method: 开箱方式
    
    Returns:
        惩罚伤害值
    """
    config = CHEST_CONFIGS.get(chest_type)
    if not config:
        return 0

    method_effects = OPEN_METHOD_EFFECTS.get(open_method, {})

    # 基础惩罚 = 宝箱等级 × 2
    level = config.get("level", 1)
    base_penalty = level * 2

    # 应用失败惩罚系数
    fail_penalty_multiplier = method_effects.get("fail_penalty_multiplier", 1.0)
    final_penalty = base_penalty * fail_penalty_multiplier

    # 元素注入专属：额外惩罚倍率（仅在失败未触发陷阱时生效）
    if open_method == "element_infusion":
        element_extra_penalty = method_effects.get("element_fail_extra_penalty", 1.0)
        final_penalty = final_penalty * element_extra_penalty

    # 向上取整，确保至少1点伤害
    return max(1, int(math.ceil(final_penalty)))


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
    open_method: str,
    bonuses: Dict[str, float],
) -> List[Dict]:
    """
    随机掉落物品
    
    Args:
        chest_type: 宝箱类型
        open_method: 开箱方式
        bonuses: 铭文综合加成
    
    Returns:
        掉落物品列表
    """
    config = CHEST_CONFIGS.get(chest_type)
    if not config:
        return []

    method_effects = OPEN_METHOD_EFFECTS.get(open_method, {})

    i_min, i_max = config["item_drop_range"]
    drop_count = random.randint(i_min, i_max)

    # 稀有物品概率加成：开箱方式 + 铭文 + 幸运折算
    method_rare_boost = method_effects.get("rare_drop_modifier", 0.0)
    inscription_rare_boost = bonuses.get("rare_chance", 0.0)
    luck_based_rare = bonuses.get("luck_boost", 0.0) * 0.3
    total_rare_boost = method_rare_boost + inscription_rare_boost + luck_based_rare

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
    
    失败惩罚机制：
    1. 失败且触发陷阱：扣血 = 基础伤害 × 陷阱类型系数 × 方式系数 × 失败惩罚系数
    2. 失败但未触发陷阱：扣血 = 宝箱等级 × 2 × 失败惩罚系数（铁=2，水晶=4，暗影=6）
    
    Args:
        chest_type: 宝箱类型 (iron_rune/crystal_seal/shadow_curse)
        open_method: 开箱方式 (magic_resonance/mechanical_pick/element_infusion)
        inscriptions: 铭文加成列表 [{"type": "fire", "level": 5}, ...]
    
    Returns:
        开箱结果字典:
        {
            "success": bool,              # 是否成功开启
            "damage": int,                # 受到的总伤害（0表示无伤害）
            "damage_breakdown": dict,     # 伤害明细（陷阱伤害/失败惩罚）
            "trap_info": dict,            # 陷阱信息（如触发）
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
            "damage_breakdown": {},
            "trap_info": {},
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
            "damage_breakdown": {},
            "trap_info": {},
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

    # ========== 步骤1：计算成功率并判定是否成功开启 ==========
    success_rate = _calculate_success_rate(chest_type, open_method, bonuses)
    roll_success = random.uniform(0, 100) < success_rate

    # ========== 步骤2：计算陷阱概率并判定是否触发陷阱 ==========
    trap_chance = _calculate_trap_chance(chest_type, open_method, bonuses)
    trap_triggered = random.uniform(0, 100) < trap_chance

    # ========== 步骤3：计算伤害 ==========
    total_damage = 0
    trap_damage = 0
    fail_penalty = 0
    element_backlash_damage = 0
    trap_info = {}
    element_backlash_triggered = False
    damage_breakdown = {}

    if trap_triggered:
        # 计算陷阱伤害（传入是否为失败触发，影响惩罚系数）
        trap_damage, trap_info = _calculate_trap_damage(
            chest_type, open_method, bonuses, is_failure=not roll_success
        )
        total_damage += trap_damage
        damage_breakdown["trap_damage"] = trap_damage

    # 处理失败惩罚
    if not roll_success:
        if not trap_triggered:
            # 失败但未触发陷阱：固定惩罚
            fail_penalty = _calculate_fail_penalty(chest_type, open_method)
            total_damage += fail_penalty
            damage_breakdown["fail_penalty"] = fail_penalty
        # 如果触发了陷阱，陷阱伤害已经包含了失败惩罚系数

        # ========== 元素注入专属逻辑：失败时额外判定元素反噬陷阱 ==========
        if open_method == "element_infusion":
            element_extra_chance = method_config.get("element_trap_extra_chance", 0.0)
            # 判定是否触发额外的元素反噬陷阱（15%概率）
            if random.uniform(0, 100) < element_extra_chance:
                element_backlash_triggered = True
                # 强制使用闪电类型陷阱（高伤害类型）
                lightning_trap = None
                for t in TRAP_TYPES:
                    if t["id"] == "lightning":
                        lightning_trap = t
                        break
                if lightning_trap is None:
                    lightning_trap = TRAP_TYPES[1] if len(TRAP_TYPES) > 1 else TRAP_TYPES[0]

                # 计算反噬伤害（使用闪电类型的伤害系数，同时应用开箱方式的陷阱伤害系数和失败惩罚系数）
                chest_cfg = CHEST_CONFIGS.get(chest_type)
                dmg_min, dmg_max = chest_cfg["trap_damage_range"]
                base_backlash_dmg = random.randint(dmg_min, dmg_max)
                lightning_multiplier = lightning_trap["damage_multiplier"]
                method_dmg_mult = method_config.get("trap_damage_multiplier", 1.0)
                fail_penalty_mult = method_config.get("fail_penalty_multiplier", 1.0)
                element_extra_penalty = method_config.get("element_fail_extra_penalty", 1.0)
                trap_reduction = bonuses.get("trap_reduction", 0.0)

                # 反噬伤害计算：基础伤害 × 闪电系数 × 方式系数 × 失败惩罚 × 元素额外惩罚，再应用减伤
                element_backlash_damage = (
                    base_backlash_dmg
                    * lightning_multiplier
                    * method_dmg_mult
                    * fail_penalty_mult
                    * element_extra_penalty
                )
                element_backlash_damage = element_backlash_damage * (1.0 - trap_reduction / 100.0)
                element_backlash_damage = max(1, int(math.ceil(element_backlash_damage)))

                # 叠加到总伤害并记录明细
                total_damage += element_backlash_damage
                damage_breakdown["element_backlash_damage"] = element_backlash_damage

    # ========== 步骤4：计算奖励（仅当成功时） ==========
    items = []
    fragments = []
    if roll_success:
        items = _drop_items(chest_type, open_method, bonuses)
        fragments = _drop_fragments(chest_type, open_method, bonuses)

    # ========== 步骤5：构造消息 ==========
    if roll_success and not trap_triggered:
        msg = f"成功开启{chest_config['name']}！获得了丰厚的奖励。"
    elif roll_success and trap_triggered:
        msg = (f"成功开启{chest_config['name']}，但触发了{trap_info.get('name', '陷阱')}，"
               f"受到{trap_damage}点伤害。")
    elif not roll_success and trap_triggered:
        # 元素注入失败且触发陷阱，再判定是否有额外反噬
        if element_backlash_triggered:
            msg = (
                f"开启{chest_config['name']}失败，触发了{trap_info.get('name', '陷阱')}，"
                f"受到{trap_damage}点伤害！元素能量失控，引发了额外的元素反噬！"
                f"反噬额外造成{element_backlash_damage}点伤害。"
            )
        else:
            msg = (f"开启{chest_config['name']}失败，触发了{trap_info.get('name', '陷阱')}，"
                   f"受到{trap_damage}点伤害！")
    else:
        # 失败但未触发陷阱
        if element_backlash_triggered:
            msg = (
                f"开启{chest_config['name']}失败，宝箱损毁，受到{fail_penalty}点轻伤。"
                f"元素能量失控，引发了额外的元素反噬！反噬额外造成{element_backlash_damage}点伤害。"
            )
        else:
            msg = f"开启{chest_config['name']}失败，宝箱损毁，受到{fail_penalty}点轻伤。"

    # ========== 步骤6：决定动画类型 ==========
    animation_type = _determine_animation(roll_success, items, trap_triggered)

    # ========== 步骤7：统计信息 ==========
    stats = {
        "success_rate": round(success_rate, 2),
        "trap_chance": round(trap_chance, 2),
        "applied_bonuses": bonuses,
        "method_effects": {
            "success_rate_boost": method_config.get("success_rate_boost", 0),
            "trap_chance_modifier": method_config.get("trap_chance_modifier", 0),
            "rare_drop_modifier": method_config.get("rare_drop_modifier", 0),
        },
    }

    return {
        "success": roll_success,
        "damage": total_damage,
        "damage_breakdown": damage_breakdown,
        "trap_info": trap_info,
        "items": items,
        "fragments": fragments,
        "message": msg,
        "animation_type": animation_type,
        "chest_info": {
            "type": chest_type,
            "name": chest_config["name"],
            "tier": chest_config["tier"],
            "level": chest_config["level"],
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


def get_trap_types() -> List[Dict]:
    """
    获取所有陷阱类型配置
    
    Returns:
        陷阱类型列表
    """
    return TRAP_TYPES
