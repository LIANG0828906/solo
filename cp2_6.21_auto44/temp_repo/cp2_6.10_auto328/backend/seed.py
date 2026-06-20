import json
import os
import random
from pathlib import Path


def main():
    data_dir = Path(__file__).parent / "data"
    data_dir.mkdir(exist_ok=True)

    fragments = [
        {"id": "bulb", "name": "灯泡", "icon": "💡", "color": "#FFD700"},
        {"id": "gear", "name": "齿轮", "icon": "⚙️", "color": "#808080"},
        {"id": "palette", "name": "调色板", "icon": "🎨", "color": "#FF6B6B"},
        {"id": "note", "name": "音符", "icon": "🎵", "color": "#4ECDC4"},
        {"id": "leaf", "name": "绿叶", "icon": "🍃", "color": "#95E1A3"},
    ]
    with open(data_dir / "fragments.json", "w", encoding="utf-8") as f:
        json.dump(fragments, f, ensure_ascii=False, indent=2)

    challenges = [
        {
            "id": 1,
            "name": "智能植物浇水器",
            "description": "为你的植物朋友打造一个智能浇水系统，让它们永远不会口渴。",
            "requiredFragments": ["bulb", "leaf", "gear"],
            "points": 100,
            "timeLimit": 90,
        },
        {
            "id": 2,
            "name": "音乐调色画框",
            "description": "一个会根据音乐节奏变换颜色的神奇画框。",
            "requiredFragments": ["note", "palette", "bulb"],
            "points": 120,
            "timeLimit": 90,
        },
        {
            "id": 3,
            "name": "机械花园",
            "description": "用齿轮驱动的自动旋转花园，让每朵花都能享受阳光。",
            "requiredFragments": ["gear", "leaf", "palette"],
            "points": 110,
            "timeLimit": 90,
        },
        {
            "id": 4,
            "name": "灯光音乐会",
            "description": "灯光随着音乐节拍舞动的迷你音乐会装置。",
            "requiredFragments": ["bulb", "note", "gear"],
            "points": 130,
            "timeLimit": 90,
        },
        {
            "id": 5,
            "name": "调色板加湿器",
            "description": "喷出彩色雾气的艺术加湿器，为房间增添梦幻氛围。",
            "requiredFragments": ["palette", "leaf", "bulb"],
            "points": 115,
            "timeLimit": 90,
        },
        {
            "id": 6,
            "name": "音符风铃",
            "description": "风吹过时会演奏优美旋律的机械风铃。",
            "requiredFragments": ["note", "gear", "leaf"],
            "points": 105,
            "timeLimit": 90,
        },
        {
            "id": 7,
            "name": "绿叶空气净化器",
            "description": "模拟植物光合作用的智能空气净化器。",
            "requiredFragments": ["leaf", "bulb", "gear"],
            "points": 125,
            "timeLimit": 90,
        },
        {
            "id": 8,
            "name": "调色板时钟",
            "description": "每个小时变换一种颜色的艺术时钟。",
            "requiredFragments": ["palette", "gear", "bulb"],
            "points": 110,
            "timeLimit": 90,
        },
        {
            "id": 9,
            "name": "音乐花盆",
            "description": "植物生长时会播放轻音乐的魔法花盆。",
            "requiredFragments": ["note", "leaf", "palette"],
            "points": 120,
            "timeLimit": 90,
        },
        {
            "id": 10,
            "name": "齿轮八音盒",
            "description": "可自定义旋律的精密机械八音盒。",
            "requiredFragments": ["gear", "note", "bulb"],
            "points": 135,
            "timeLimit": 90,
        },
        {
            "id": 11,
            "name": "彩虹生成器",
            "description": "利用光线和水滴在室内制造美丽彩虹的装置。",
            "requiredFragments": ["bulb", "palette", "leaf"],
            "points": 140,
            "timeLimit": 90,
        },
        {
            "id": 12,
            "name": "自然白噪音机",
            "description": "模拟大自然声音的助眠白噪音机。",
            "requiredFragments": ["leaf", "note", "gear"],
            "points": 100,
            "timeLimit": 90,
        },
        {
            "id": 13,
            "name": "调色板温度计",
            "description": "根据温度变化颜色的创意温度计。",
            "requiredFragments": ["palette", "bulb", "gear"],
            "points": 105,
            "timeLimit": 90,
        },
        {
            "id": 14,
            "name": "音乐感应灯",
            "description": "会随着环境音乐自动调节亮度和颜色的智能灯。",
            "requiredFragments": ["note", "bulb", "palette"],
            "points": 125,
            "timeLimit": 90,
        },
        {
            "id": 15,
            "name": "机械蝴蝶",
            "description": "翅膀会随音乐扇动的机械蝴蝶装饰品。",
            "requiredFragments": ["gear", "palette", "note"],
            "points": 130,
            "timeLimit": 90,
        },
        {
            "id": 16,
            "name": "光合作用台灯",
            "description": "既能照明又能帮助植物生长的多功能台灯。",
            "requiredFragments": ["bulb", "leaf", "palette"],
            "points": 115,
            "timeLimit": 90,
        },
        {
            "id": 17,
            "name": "旋律风车",
            "description": "转动时会发出不同音符的创意风车。",
            "requiredFragments": ["gear", "note", "leaf"],
            "points": 105,
            "timeLimit": 90,
        },
        {
            "id": 18,
            "name": "色彩音乐转换器",
            "description": "可以将颜色转换成对应旋律的神奇装置。",
            "requiredFragments": ["palette", "note", "gear"],
            "points": 145,
            "timeLimit": 90,
        },
    ]
    with open(data_dir / "challenges.json", "w", encoding="utf-8") as f:
        json.dump(challenges, f, ensure_ascii=False, indent=2)

    achievements = [
        {
            "id": "first_invention",
            "name": "初出茅庐",
            "description": "完成第一个发明",
            "icon": "🌟",
            "rarity": "common",
        },
        {
            "id": "speed_inventor",
            "name": "快手发明家",
            "description": "30秒内完成挑战",
            "icon": "⚡",
            "rarity": "rare",
        },
        {
            "id": "perfect_day",
            "name": "完美一天",
            "description": "完成当日所有5个挑战",
            "icon": "🏆",
            "rarity": "epic",
        },
        {
            "id": "creative_master",
            "name": "创意大师",
            "description": "累计完成50个发明",
            "icon": "👑",
            "rarity": "legendary",
        },
        {
            "id": "legendary_craftsman",
            "name": "传奇工匠",
            "description": "获得传说级成就",
            "icon": "💎",
            "rarity": "legendary",
        },
        {
            "id": "hundred_points",
            "name": "百分达人",
            "description": "单次挑战获得100分以上",
            "icon": "💯",
            "rarity": "common",
        },
        {
            "id": "combo_master",
            "name": "连击大师",
            "description": "连续完成5个挑战",
            "icon": "🔥",
            "rarity": "rare",
        },
        {
            "id": "collector",
            "name": "碎片收藏家",
            "description": "使用过所有类型的碎片",
            "icon": "🎒",
            "rarity": "epic",
        },
    ]
    with open(data_dir / "achievements.json", "w", encoding="utf-8") as f:
        json.dump(achievements, f, ensure_ascii=False, indent=2)

    user_data = {
        "totalScore": 0,
        "completedChallenges": [],
        "achievements": [],
        "dailyRecords": [],
    }
    with open(data_dir / "user_data.json", "w", encoding="utf-8") as f:
        json.dump(user_data, f, ensure_ascii=False, indent=2)

    print("✅ 数据文件已生成！")
    print(f"📁 目录: {data_dir}")
    print(f"  - fragments.json ({len(fragments)} 种碎片)")
    print(f"  - challenges.json ({len(challenges)} 个挑战)")
    print(f"  - achievements.json ({len(achievements)} 个成就)")
    print(f"  - user_data.json (初始用户数据)")


if __name__ == "__main__":
    main()
