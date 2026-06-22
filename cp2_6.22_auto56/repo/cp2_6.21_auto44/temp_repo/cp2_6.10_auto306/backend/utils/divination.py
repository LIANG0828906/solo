import hashlib
from typing import Tuple
from models import Sigil, DivinationFormation


formation_names = {
    "阴阳": "两仪阵",
    "三才": "三才阵",
    "四象": "四象阵",
    "五行": "五行阵",
    "六合": "六合阵",
    "七星": "七星阵",
    "八卦": "八卦阵",
    "九宫": "九宫阵",
    "天地": "乾坤阵",
    "水火": "既济阵",
    "雷风": "恒益阵",
    "山泽": "咸损阵"
}


formation_descriptions = {
    "两仪阵": "阴阳相生，两极交汇，主平衡调和之势",
    "三才阵": "天地人三才合一，主天时地利人和",
    "四象阵": "四方神兽守护，主稳定安康",
    "五行阵": "金木水火土五行循环，主生生不息",
    "六合阵": "六爻相合，主诸事顺遂",
    "七星阵": "北斗七星指引，主前途光明",
    "八卦阵": "八卦推演，主变化无穷",
    "九宫阵": "九宫飞星，主气运流转",
    "乾坤阵": "天地定位，主大局已定",
    "既济阵": "水火相交，主阴阳调和",
    "恒益阵": "雷风相薄，主长久受益",
    "咸损阵": "山泽通气，主感应相通"
}


positions = ["上乾下坤", "上坤下乾", "上离下坎", "上坎下离", "上震下巽", "上巽下震", "上艮下兑", "上兑下艮"]


def generate_formation_id(sigil1_id: str, sigil2_id: str) -> str:
    combined = f"{sigil1_id}_{sigil2_id}"
    hash_object = hashlib.md5(combined.encode())
    hash_hex = hash_object.hexdigest()
    return f"formation_{hash_hex[:8]}"


def get_formation_type(sigil1: Sigil, sigil2: Sigil) -> str:
    type_map = {
        ("心境签", "心境签"): "阴阳",
        ("心境签", "星运签"): "三才",
        ("心境签", "元素签"): "四象",
        ("星运签", "心境签"): "五行",
        ("星运签", "星运签"): "六合",
        ("星运签", "元素签"): "七星",
        ("元素签", "心境签"): "八卦",
        ("元素签", "星运签"): "九宫",
        ("元素签", "元素签"): "天地"
    }

    element_map = {
        ("水", "火"): "水火",
        ("火", "水"): "水火",
        ("雷", "风"): "雷风",
        ("风", "雷"): "雷风",
        ("山", "泽"): "山泽",
        ("泽", "山"): "山泽"
    }

    type_pair = (sigil1.type, sigil2.type)
    if type_pair in type_map:
        return type_map[type_pair]

    element_pair = (sigil1.element, sigil2.element)
    if element_pair in element_map:
        return element_map[element_pair]

    return "五行"


def generate_formation(sigil1: Sigil, sigil2: Sigil) -> DivinationFormation:
    formation_id = generate_formation_id(sigil1.id, sigil2.id)
    formation_type = get_formation_type(sigil1, sigil2)
    formation_name = formation_names.get(formation_type, "五行阵")
    description = formation_descriptions.get(formation_name, "五行循环，主生生不息")

    pos_index = (hash(sigil1.id) + hash(sigil2.id)) % len(positions)
    position = positions[pos_index]

    return DivinationFormation(
        formation_id=formation_id,
        formation_name=formation_name,
        description=description,
        position=position
    )
