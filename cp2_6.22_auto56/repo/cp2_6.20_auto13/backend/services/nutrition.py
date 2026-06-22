import json
from pathlib import Path

NUTRITION_DB_PATH = Path(__file__).parent.parent / "nutrition_db.json"

_nutrition_cache = None


def load_nutrition_db() -> dict:
    global _nutrition_cache
    if _nutrition_cache is None:
        with open(NUTRITION_DB_PATH, "r", encoding="utf-8") as f:
            _nutrition_cache = json.load(f)
    return _nutrition_cache


def calculate_nutrition(ingredients: list) -> dict:
    db = load_nutrition_db()
    total = {"calories": 0.0, "protein": 0.0, "fat": 0.0, "carbs": 0.0, "fiber": 0.0}
    for ing in ingredients:
        name = ing.get("name", "")
        amount = ing.get("amount", 0)
        unit = ing.get("unit", "")
        entry = db.get(name)
        if not entry:
            continue
        entry_unit = entry.get("unit", "100g")
        base_amount = 100.0
        if entry_unit == "100ml":
            base_amount = 100.0
        elif entry_unit == "100g":
            base_amount = 100.0
        ratio = amount / base_amount if base_amount > 0 else 0
        if unit == "g" or unit == "ml":
            ratio = amount / base_amount
        elif unit == "kg":
            ratio = (amount * 1000) / base_amount
        elif unit == "个":
            ratio = amount * 0.6
        elif unit == "勺":
            ratio = amount * 0.15
        elif unit == "少许" or unit == "适量":
            ratio = 0.05
        else:
            ratio = amount / base_amount
        total["calories"] += entry.get("calories", 0) * ratio
        total["protein"] += entry.get("protein", 0) * ratio
        total["fat"] += entry.get("fat", 0) * ratio
        total["carbs"] += entry.get("carbs", 0) * ratio
        total["fiber"] += entry.get("fiber", 0) * ratio
    total = {k: round(v, 1) for k, v in total.items()}
    return total


def get_replacements(ingredient_name: str) -> list:
    db = load_nutrition_db()
    entry = db.get(ingredient_name)
    if not entry:
        return []
    replacements = entry.get("replacements", [])
    result = []
    for r in replacements:
        r_entry = db.get(r)
        if r_entry:
            result.append({
                "name": r,
                "calories": r_entry.get("calories", 0),
                "protein": r_entry.get("protein", 0),
                "fat": r_entry.get("fat", 0),
                "carbs": r_entry.get("carbs", 0),
                "fiber": r_entry.get("fiber", 0),
                "unit": r_entry.get("unit", "100g"),
            })
    return result
