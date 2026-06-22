from typing import List, Dict, Any
from dataclasses import dataclass
from enum import Enum


class Season(str, Enum):
    SPRING = "春"
    SUMMER = "夏"
    AUTUMN = "秋"
    WINTER = "冬"


class Category(str, Enum):
    ROSE = "玫瑰类"
    LILY = "百合类"
    CHRYSANTHEMUM = "菊类"
    FOLIAGE = "配叶类"
    FILLER = "填充花类"


class ShapeType(str, Enum):
    ROUND = "圆形"
    SPIKE = "穗形"
    SPRAY = "散形"
    LINE = "线形"
    MASS = "团形"


@dataclass
class Flower:
    id: str
    name: str
    category: Category
    color: str
    color_hex: str
    shape: ShapeType
    height: int
    seasons: List[Season]
    meaning: str
    image: str
    pairings: List[str]


FLOWERS: List[Flower] = [
    Flower(
        id="rose-red",
        name="红玫瑰",
        category=Category.ROSE,
        color="红色",
        color_hex="#e74c3c",
        shape=ShapeType.ROUND,
        height=55,
        seasons=[Season.SPRING, Season.SUMMER],
        meaning="热情如火的爱恋，是藏在花瓣深处最真挚的告白，每一朵都诉说着永恒的深情。",
        image="🌹",
        pairings=["lily-white", "eucalyptus", "gypsophila"]
    ),
    Flower(
        id="rose-pink",
        name="粉玫瑰",
        category=Category.ROSE,
        color="粉色",
        color_hex="#ff9ff3",
        shape=ShapeType.ROUND,
        height=50,
        seasons=[Season.SPRING, Season.SUMMER],
        meaning="初恋的悸动与温柔的情意，如晨露般清新，是少女心事的最美写照。",
        image="🌸",
        pairings=["lily-pink", "fern", "statice"]
    ),
    Flower(
        id="rose-white",
        name="白玫瑰",
        category=Category.ROSE,
        color="白色",
        color_hex="#fafafa",
        shape=ShapeType.ROUND,
        height=52,
        seasons=[Season.SPRING, Season.AUTUMN],
        meaning="纯洁无瑕的心灵，与神圣而坚贞的爱情，如雪山上绽放的第一缕阳光。",
        image="🤍",
        pairings=["rose-red", "lily-orange", "eucalyptus"]
    ),
    Flower(
        id="lily-white",
        name="白百合",
        category=Category.LILY,
        color="白色",
        color_hex="#ffffff",
        shape=ShapeType.SPIKE,
        height=75,
        seasons=[Season.SPRING, Season.SUMMER],
        meaning="百年好合的美好祝愿，圣洁典雅的东方之美，承载着对幸福最虔诚的期许。",
        image="💮",
        pairings=["rose-pink", "chrysanthemum-white", "fern"]
    ),
    Flower(
        id="lily-pink",
        name="粉百合",
        category=Category.LILY,
        color="粉色",
        color_hex="#f8b4c4",
        shape=ShapeType.SPIKE,
        height=70,
        seasons=[Season.SUMMER, Season.AUTUMN],
        meaning="清纯高雅的气质，如梦似幻的浪漫，是春天落在心间的温柔吻痕。",
        image="🌷",
        pairings=["rose-white", "gypsophila", "eucalyptus"]
    ),
    Flower(
        id="lily-orange",
        name="橙百合",
        category=Category.LILY,
        color="橙色",
        color_hex="#ff9f43",
        shape=ShapeType.SPIKE,
        height=72,
        seasons=[Season.SUMMER],
        meaning="热情洋溢的生命力与富贵吉祥，如夏日骄阳般温暖明亮，驱散所有阴霾。",
        image="🌺",
        pairings=["rose-red", "sunflower", "statice"]
    ),
    Flower(
        id="chrysanthemum-white",
        name="白菊",
        category=Category.CHRYSANTHEMUM,
        color="白色",
        color_hex="#f5f5f5",
        shape=ShapeType.ROUND,
        height=45,
        seasons=[Season.AUTUMN, Season.WINTER],
        meaning="高洁清雅的君子之风，傲然挺立的风骨，是秋日最动人的诗意。",
        image="🌼",
        pairings=["eucalyptus", "fern", "lily-white"]
    ),
    Flower(
        id="chrysanthemum-yellow",
        name="黄菊",
        category=Category.CHRYSANTHEMUM,
        color="黄色",
        color_hex="#f1c40f",
        shape=ShapeType.ROUND,
        height=48,
        seasons=[Season.AUTUMN],
        meaning="飞黄腾达的美好祝愿，与淡泊名利的隐逸情怀，是金秋最温暖的色彩。",
        image="🌻",
        pairings=["rose-red", "carnation", "sunflower"]
    ),
    Flower(
        id="sunflower",
        name="向日葵",
        category=Category.CHRYSANTHEMUM,
        color="黄色",
        color_hex="#f39c12",
        shape=ShapeType.ROUND,
        height=80,
        seasons=[Season.SUMMER],
        meaning="追逐阳光的勇气，积极向上的生命力量，每一次抬头都是对生活的热爱。",
        image="🌻",
        pairings=["rose-red", "lily-orange", "eucalyptus"]
    ),
    Flower(
        id="carnation",
        name="康乃馨",
        category=Category.CHRYSANTHEMUM,
        color="粉色",
        color_hex="#ff6b81",
        shape=ShapeType.SPRAY,
        height=42,
        seasons=[Season.SPRING, Season.WINTER],
        meaning="母爱的伟大与温馨，是感恩与思念的化身，花开时温柔了整个岁月。",
        image="💗",
        pairings=["lily-white", "gypsophila", "fern"]
    ),
    Flower(
        id="eucalyptus",
        name="尤加利叶",
        category=Category.FOLIAGE,
        color="绿色",
        color_hex="#78a07a",
        shape=ShapeType.LINE,
        height=60,
        seasons=[Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER],
        meaning="来自大自然的恩赐与祝福，静默守护的温柔，为花束增添一抹清新脱俗。",
        image="🌿",
        pairings=["rose-red", "lily-white", "sunflower", "carnation"]
    ),
    Flower(
        id="fern",
        name="蕨叶",
        category=Category.FOLIAGE,
        color="绿色",
        color_hex="#4a7c59",
        shape=ShapeType.LINE,
        height=55,
        seasons=[Season.SPRING, Season.SUMMER, Season.AUTUMN],
        meaning="质朴纯真的情感，如森林深处的低语，低调却充满生机的存在感。",
        image="🍃",
        pairings=["lily-white", "chrysanthemum-white", "rose-white"]
    ),
    Flower(
        id="ivy",
        name="常春藤",
        category=Category.FOLIAGE,
        color="深绿",
        color_hex="#2d5016",
        shape=ShapeType.LINE,
        height=65,
        seasons=[Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER],
        meaning="永不凋零的友谊与忠诚，四季常青的陪伴，是岁月里最温暖的约定。",
        image="🌱",
        pairings=["rose-pink", "carnation", "lily-pink"]
    ),
    Flower(
        id="gypsophila",
        name="满天星",
        category=Category.FILLER,
        color="白色",
        color_hex="#eeeeee",
        shape=ShapeType.SPRAY,
        height=40,
        seasons=[Season.SPRING, Season.SUMMER],
        meaning="繁星点点的思念，清纯无邪的梦境，愿做配角只为衬托你的美丽。",
        image="✨",
        pairings=["rose-red", "lily-white", "carnation", "rose-pink"]
    ),
    Flower(
        id="statice",
        name="勿忘我",
        category=Category.FILLER,
        color="紫色",
        color_hex="#8e44ad",
        shape=ShapeType.SPRAY,
        height=45,
        seasons=[Season.SUMMER, Season.AUTUMN],
        meaning="永恒不变的爱与记忆，请不要忘记我，这是跨越时光的深情承诺。",
        image="💜",
        pairings=["rose-white", "lily-pink", "chrysanthemum-white"]
    ),
    Flower(
        id="baby-breath",
        name="情人草",
        category=Category.FILLER,
        color="淡粉",
        color_hex="#fadadd",
        shape=ShapeType.SPRAY,
        height=38,
        seasons=[Season.SPRING, Season.SUMMER],
        meaning="浪漫甜蜜的情意，朦胧如梦的爱恋，是爱情中最细腻柔软的瞬间。",
        image="💕",
        pairings=["rose-pink", "lily-pink", "carnation"]
    ),
    Flower(
        id="lavender",
        name="薰衣草",
        category=Category.FILLER,
        color="紫色",
        color_hex="#9b59b6",
        shape=ShapeType.SPIKE,
        height=50,
        seasons=[Season.SUMMER],
        meaning="等待爱情的浪漫，芬芳四溢的温柔，普罗旺斯的风带来紫色的梦。",
        image="💐",
        pairings=["rose-white", "eucalyptus", "gypsophila"]
    )
]


def get_flowers_as_dict() -> List[Dict[str, Any]]:
    result = []
    for flower in FLOWERS:
        result.append({
            "id": flower.id,
            "name": flower.name,
            "category": flower.category.value,
            "color": flower.color,
            "color_hex": flower.color_hex,
            "shape": flower.shape.value,
            "height": flower.height,
            "seasons": [s.value for s in flower.seasons],
            "meaning": flower.meaning,
            "image": flower.image,
            "pairings": flower.pairings
        })
    return result


def get_flower_by_id(flower_id: str) -> Flower:
    for flower in FLOWERS:
        if flower.id == flower_id:
            return flower
    raise ValueError(f"Flower with id {flower_id} not found")


SEASON_COMPATIBILITY: Dict[Season, List[Season]] = {
    Season.SPRING: [Season.SPRING, Season.SUMMER],
    Season.SUMMER: [Season.SPRING, Season.SUMMER, Season.AUTUMN],
    Season.AUTUMN: [Season.SUMMER, Season.AUTUMN, Season.WINTER],
    Season.WINTER: [Season.AUTUMN, Season.WINTER, Season.SPRING]
}

COLOR_HARMONY: Dict[str, List[str]] = {
    "红色": ["粉色", "白色", "橙色", "黄色"],
    "粉色": ["红色", "白色", "紫色", "淡粉"],
    "白色": ["红色", "粉色", "橙色", "紫色", "绿色", "深绿"],
    "橙色": ["红色", "黄色", "白色"],
    "黄色": ["橙色", "红色", "白色", "绿色"],
    "紫色": ["粉色", "白色", "淡粉", "绿色"],
    "淡粉": ["粉色", "紫色", "白色"],
    "绿色": ["白色", "红色", "紫色", "黄色"],
    "深绿": ["白色", "粉色", "红色"]
}
