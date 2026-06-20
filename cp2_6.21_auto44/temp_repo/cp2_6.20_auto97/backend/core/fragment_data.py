"""
法器碎片与铭文数据模块
定义属性碎片、铭文加成效果、合成表等数据
"""

from typing import Dict, List, Optional


# ============== 五大属性碎片定义 ==============
FRAGMENT_TYPES: List[str] = ["fire", "ice", "thunder", "shadow", "holy"]

# 属性碎片基础信息
FRAGMENT_INFO: Dict[str, Dict] = {
    "fire": {
        "name": "烈焰碎片",
        "description": "蕴含炽热火焰之力的神秘碎片",
        "color": "#FF4500",
        "element": "火",
    },
    "ice": {
        "name": "寒冰碎片",
        "description": "凝结永恒冰霜之力的晶莹碎片",
        "color": "#00CED1",
        "element": "冰",
    },
    "thunder": {
        "name": "雷霆碎片",
        "description": "凝聚天雷之力的闪电碎片",
        "color": "#FFD700",
        "element": "雷",
    },
    "shadow": {
        "name": "暗影碎片",
        "description": "笼罩黑暗之力的诡异碎片",
        "color": "#4B0082",
        "element": "暗",
    },
    "holy": {
        "name": "圣光碎片",
        "description": "散发神圣光辉之力的纯净碎片",
        "color": "#FFFAF0",
        "element": "光",
    },
}


# ============== 铭文加成效果定义 ==============
"""
铭文类型说明：
- success_boost: 增加开箱成功率（百分比）
- trap_reduction: 减少陷阱伤害（百分比）
- fragment_bonus: 增加碎片掉落数量（额外个数）
- rare_chance: 增加稀有物品掉落概率（百分比）
- luck_boost: 综合幸运加成（百分比，影响所有随机判定）
"""

# 各属性法器的铭文加成效果（每级加成）
INSCRIPTION_EFFECTS: Dict[str, Dict[str, Dict]] = {
    "fire": {
        "name": "烈焰铭文",
        "base_effects": {
            "success_boost": 2.0,      # 每级增加2%成功率
            "rare_chance": 1.5,        # 每级增加1.5%稀有概率
        },
        "max_level": 10,
        "description": "火焰之力加持，提升开箱成功率与稀有掉落",
    },
    "ice": {
        "name": "寒冰铭文",
        "base_effects": {
            "trap_reduction": 5.0,     # 每级减少5%陷阱伤害
            "success_boost": 1.0,      # 每级增加1%成功率
        },
        "max_level": 10,
        "description": "冰霜护佑，减少陷阱伤害并小幅提升成功率",
    },
    "thunder": {
        "name": "雷霆铭文",
        "base_effects": {
            "success_boost": 3.0,      # 每级增加3%成功率
            "trap_reduction": 2.0,     # 每级减少2%陷阱伤害
        },
        "max_level": 10,
        "description": "雷霆破障，大幅提升成功率并减少部分陷阱伤害",
    },
    "shadow": {
        "name": "暗影铭文",
        "base_effects": {
            "rare_chance": 3.0,        # 每级增加3%稀有概率
            "fragment_bonus": 1,       # 每级额外掉落1个碎片（每2级+1）
        },
        "max_level": 10,
        "description": "暗影潜行，显著提升稀有掉落与碎片获取",
    },
    "holy": {
        "name": "圣光铭文",
        "base_effects": {
            "trap_reduction": 8.0,     # 每级减少8%陷阱伤害
            "luck_boost": 2.0,         # 每级增加2%综合幸运
        },
        "max_level": 10,
        "description": "圣光庇护，极大减少陷阱伤害并提升综合运气",
    },
}


# ============== 碎片合成表 ==============
"""
合成规则：
- 合成法器需要消耗对应属性的碎片
- 低级合成：5个碎片 → 1个随机铭文（1-3级）
- 中级合成：15个碎片 → 1个随机铭文（3-6级）
- 高级合成：40个碎片 → 1个随机铭文（6-10级）
"""
FRAGMENT_RECIPES: Dict[str, Dict] = {
    "basic_synthesis": {
        "name": "基础合成",
        "fragments_required": 5,
        "inscription_level_range": [1, 3],
        "success_rate": 100.0,
    },
    "intermediate_synthesis": {
        "name": "中级合成",
        "fragments_required": 15,
        "inscription_level_range": [3, 6],
        "success_rate": 85.0,
    },
    "advanced_synthesis": {
        "name": "高级合成",
        "fragments_required": 40,
        "inscription_level_range": [6, 10],
        "success_rate": 60.0,
    },
}


# ============== 数据查询函数 ==============

def get_fragment_info(fragment_type: str) -> Optional[Dict]:
    """
    获取指定属性碎片的详细信息
    
    Args:
        fragment_type: 碎片类型 (fire/ice/thunder/shadow/holy)
    
    Returns:
        碎片信息字典，类型不存在则返回None
    """
    return FRAGMENT_INFO.get(fragment_type)


def get_all_fragments() -> Dict[str, Dict]:
    """
    获取所有属性碎片的信息
    
    Returns:
        全部碎片信息字典
    """
    return FRAGMENT_INFO


def get_inscription_effects(inscription_type: str) -> Optional[Dict]:
    """
    获取指定属性铭文的加成效果定义
    
    Args:
        inscription_type: 铭文属性类型 (fire/ice/thunder/shadow/holy)
    
    Returns:
        铭文效果定义字典，类型不存在则返回None
    """
    return INSCRIPTION_EFFECTS.get(inscription_type)


def calculate_inscription_bonuses(inscriptions: List[Dict]) -> Dict[str, float]:
    """
    根据装备的铭文列表计算综合加成效果
    
    Args:
        inscriptions: 铭文数组，每项包含 type(属性类型) 和 level(等级)
        示例: [{"type": "fire", "level": 5}, {"type": "holy", "level": 3}]
    
    Returns:
        综合加成字典:
        {
            "success_boost": 总成功率加成%,
            "trap_reduction": 总陷阱伤害减少%,
            "fragment_bonus": 额外碎片掉落数,
            "rare_chance": 稀有物品额外概率%,
            "luck_boost": 综合幸运加成%
        }
    """
    bonuses = {
        "success_boost": 0.0,
        "trap_reduction": 0.0,
        "fragment_bonus": 0,
        "rare_chance": 0.0,
        "luck_boost": 0.0,
    }

    for inscription in inscriptions:
        ins_type = inscription.get("type")
        ins_level = inscription.get("level", 1)

        # 等级限制在有效范围内
        ins_level = max(1, min(ins_level, 10))

        effects_def = INSCRIPTION_EFFECTS.get(ins_type)
        if not effects_def:
            continue

        base_effects = effects_def["base_effects"]

        # 逐属性累加加成
        for effect_name, per_level_value in base_effects.items():
            if effect_name == "fragment_bonus":
                # 碎片加成：每2级+1个（向下取整）
                bonuses[effect_name] += int(ins_level / 2) * per_level_value
            else:
                # 其他百分比加成：等级 * 每级数值
                bonuses[effect_name] += ins_level * per_level_value

    # 陷阱减少上限为95%，避免完全免疫
    if bonuses["trap_reduction"] > 95.0:
        bonuses["trap_reduction"] = 95.0

    return bonuses


def get_synthesis_recipe(recipe_key: str) -> Optional[Dict]:
    """
    获取指定合成配方的信息
    
    Args:
        recipe_key: 合成配方键名 (basic_synthesis/intermediate_synthesis/advanced_synthesis)
    
    Returns:
        合成配方信息字典，配方不存在则返回None
    """
    return FRAGMENT_RECIPES.get(recipe_key)


def get_all_synthesis_recipes() -> Dict[str, Dict]:
    """
    获取所有合成配方信息
    
    Returns:
        全部合成配方字典
    """
    return FRAGMENT_RECIPES
