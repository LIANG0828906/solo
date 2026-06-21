from typing import Dict

ZONE_MAPPING: Dict[str, str] = {
    "vegetable": "produce",
    "fruit": "produce",
    "meat": "meat_seafood",
    "seafood": "meat_seafood",
    "dairy": "dairy_eggs",
    "eggs": "dairy_eggs",
    "spice": "seasoning",
    "sauce": "seasoning",
    "grain": "staples",
    "oil": "staples",
    "other": "other",
}


def get_zone(category: str) -> str:
    return ZONE_MAPPING.get(category.lower(), "other")
