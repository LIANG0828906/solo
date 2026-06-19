from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import random
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Ingredient(BaseModel):
    id: str
    name: str
    type: str
    color: str
    abv: float
    amount: float
    unit: str
    labelColor: Optional[str] = None

class Recipe(BaseModel):
    id: str
    name: str
    description: str
    ingredients: List[Ingredient]
    steps: List[str]
    glassType: str
    standardOrder: List[str]

class MixStep(BaseModel):
    ingredientId: str
    ingredientName: str
    timestamp: float
    order: int
    type: str

class ScoreRequest(BaseModel):
    recipeId: str
    steps: List[MixStep]
    totalTime: float

class ScoreResult(BaseModel):
    accuracy: float
    stars: int
    starColor: str
    feedback: str
    timeBonus: float

RECIPES_DATA: Dict = {
    "whiskey-sour": {
        "id": "whiskey-sour",
        "name": "威士忌酸",
        "description": "经典威士忌鸡尾酒，酸甜平衡，口感清爽",
        "glassType": "古典杯",
        "ingredients": [
            {"id": "whiskey", "name": "波本威士忌", "type": "base", "color": "#d4a574", "abv": 40, "amount": 60, "unit": "ml", "labelColor": "#f4d03f"},
            {"id": "lime-juice", "name": "青柠汁", "type": "mixer", "color": "#abebc6", "abv": 0, "amount": 30, "unit": "ml", "labelColor": "#2ecc71"},
            {"id": "simple-syrup", "name": "糖浆", "type": "mixer", "color": "#fef9e7", "abv": 0, "amount": 20, "unit": "ml", "labelColor": "#f7dc6f"},
            {"id": "bitters", "name": "安格斯特拉苦精", "type": "mixer", "color": "#7b241c", "abv": 44.7, "amount": 2, "unit": "dash", "labelColor": "#922b21"},
            {"id": "cherry", "name": "樱桃", "type": "garnish", "color": "#e74c3c", "abv": 0, "amount": 1, "unit": "颗"},
            {"id": "lemon", "name": "柠檬片", "type": "garnish", "color": "#f7dc6f", "abv": 0, "amount": 1, "unit": "片"},
        ],
        "steps": [
            "将波本威士忌倒入调酒壶",
            "加入青柠汁和糖浆",
            "加入安格斯特拉苦精",
            "加入冰块摇匀",
            "过滤倒入古典杯",
            "用樱桃和柠檬片装饰"
        ],
        "standardOrder": ["whiskey", "lime-juice", "simple-syrup", "bitters", "cherry", "lemon"]
    },
    "mojito": {
        "id": "mojito",
        "name": "莫吉托",
        "description": "清爽的朗姆酒鸡尾酒，带有薄荷和青柠的清新香气",
        "glassType": "高球杯",
        "ingredients": [
            {"id": "rum", "name": "朗姆酒", "type": "base", "color": "#f5cba7", "abv": 38, "amount": 60, "unit": "ml", "labelColor": "#e67e22"},
            {"id": "lime-juice", "name": "青柠汁", "type": "mixer", "color": "#abebc6", "abv": 0, "amount": 30, "unit": "ml", "labelColor": "#2ecc71"},
            {"id": "simple-syrup", "name": "糖浆", "type": "mixer", "color": "#fef9e7", "abv": 0, "amount": 20, "unit": "ml", "labelColor": "#f7dc6f"},
            {"id": "mint-leaf", "name": "薄荷叶", "type": "garnish", "color": "#27ae60", "abv": 0, "amount": 8, "unit": "片"},
            {"id": "cola", "name": "可乐", "type": "mixer", "color": "#4a235a", "abv": 0, "amount": 90, "unit": "ml", "labelColor": "#884ea0"},
            {"id": "lemon", "name": "柠檬片", "type": "garnish", "color": "#f7dc6f", "abv": 0, "amount": 1, "unit": "片"},
        ],
        "steps": [
            "将薄荷叶放入杯底轻轻捣碎",
            "加入青柠汁和糖浆",
            "倒入朗姆酒",
            "加入冰块搅拌",
            "用可乐补满",
            "用薄荷叶和柠檬片装饰"
        ],
        "standardOrder": ["mint-leaf", "lime-juice", "simple-syrup", "rum", "cola", "lemon"]
    },
    "manhattan": {
        "id": "manhattan",
        "name": "曼哈顿",
        "description": "经典威士忌鸡尾酒，带有味美思的香甜风味",
        "glassType": "鸡尾酒杯",
        "ingredients": [
            {"id": "whiskey", "name": "波本威士忌", "type": "base", "color": "#d4a574", "abv": 40, "amount": 60, "unit": "ml", "labelColor": "#f4d03f"},
            {"id": "vermouth", "name": "味美思", "type": "mixer", "color": "#a93226", "abv": 18, "amount": 30, "unit": "ml", "labelColor": "#c0392b"},
            {"id": "bitters", "name": "安格斯特拉苦精", "type": "mixer", "color": "#7b241c", "abv": 44.7, "amount": 2, "unit": "dash", "labelColor": "#922b21"},
            {"id": "cherry", "name": "樱桃", "type": "garnish", "color": "#e74c3c", "abv": 0, "amount": 1, "unit": "颗"},
        ],
        "steps": [
            "将威士忌倒入调酒壶",
            "加入味美思和苦精",
            "加入冰块搅拌均匀",
            "过滤倒入冰镇鸡尾酒杯",
            "用樱桃装饰"
        ],
        "standardOrder": ["whiskey", "vermouth", "bitters", "cherry"]
    },
    "martini": {
        "id": "martini",
        "name": "马天尼",
        "description": "经典金酒鸡尾酒，优雅而有力",
        "glassType": "鸡尾酒杯",
        "ingredients": [
            {"id": "gin", "name": "金酒", "type": "base", "color": "#d5f5e3", "abv": 37.5, "amount": 60, "unit": "ml", "labelColor": "#27ae60"},
            {"id": "vermouth", "name": "味美思", "type": "mixer", "color": "#a93226", "abv": 18, "amount": 15, "unit": "ml", "labelColor": "#c0392b"},
            {"id": "olive", "name": "橄榄", "type": "garnish", "color": "#1e8449", "abv": 0, "amount": 2, "unit": "颗"},
        ],
        "steps": [
            "将金酒和味美思倒入调酒杯",
            "加入冰块搅拌30秒",
            "过滤倒入冰镇鸡尾酒杯",
            "用橄榄装饰"
        ],
        "standardOrder": ["gin", "vermouth", "olive"]
    },
    "long-island": {
        "id": "long-island",
        "name": "长岛冰茶",
        "description": "强力混合鸡尾酒，多种基酒的完美融合",
        "glassType": "高球杯",
        "ingredients": [
            {"id": "vodka", "name": "伏特加", "type": "base", "color": "#e8e8e8", "abv": 40, "amount": 15, "unit": "ml", "labelColor": "#3498db"},
            {"id": "rum", "name": "朗姆酒", "type": "base", "color": "#f5cba7", "abv": 38, "amount": 15, "unit": "ml", "labelColor": "#e67e22"},
            {"id": "gin", "name": "金酒", "type": "base", "color": "#d5f5e3", "abv": 37.5, "amount": 15, "unit": "ml", "labelColor": "#27ae60"},
            {"id": "tequila", "name": "龙舌兰", "type": "base", "color": "#f9e79f", "abv": 38, "amount": 15, "unit": "ml", "labelColor": "#f1c40f"},
            {"id": "triple-sec", "name": "橙味力娇酒", "type": "mixer", "color": "#f9e79f", "abv": 30, "amount": 15, "unit": "ml", "labelColor": "#f39c12"},
            {"id": "lime-juice", "name": "青柠汁", "type": "mixer", "color": "#abebc6", "abv": 0, "amount": 25, "unit": "ml", "labelColor": "#2ecc71"},
            {"id": "simple-syrup", "name": "糖浆", "type": "mixer", "color": "#fef9e7", "abv": 0, "amount": 15, "unit": "ml", "labelColor": "#f7dc6f"},
            {"id": "cola", "name": "可乐", "type": "mixer", "color": "#4a235a", "abv": 0, "amount": 30, "unit": "ml", "labelColor": "#884ea0"},
            {"id": "lemon", "name": "柠檬片", "type": "garnish", "color": "#f7dc6f", "abv": 0, "amount": 1, "unit": "片"},
        ],
        "steps": [
            "将所有基酒倒入调酒壶",
            "加入橙味力娇酒、青柠汁和糖浆",
            "加入冰块摇匀",
            "过滤倒入加冰的高球杯",
            "用可乐补满",
            "用柠檬片装饰"
        ],
        "standardOrder": ["vodka", "rum", "gin", "tequila", "triple-sec", "lime-juice", "simple-syrup", "cola", "lemon"]
    }
}

RECIPES = [Recipe(**recipe_data) for recipe_data in RECIPES_DATA.values()]

def levenshtein_distance(s1: List[str], s2: List[str]) -> int:
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)

    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]

def calculate_sequence_similarity(user_order: List[str], standard_order: List[str]) -> float:
    if not standard_order:
        return 100.0
    if not user_order:
        return 0.0

    distance = levenshtein_distance(user_order, standard_order)
    max_len = max(len(user_order), len(standard_order))
    if max_len == 0:
        return 100.0

    similarity = max(0.0, (1 - distance / max_len) * 100)
    return similarity

def calculate_ingredient_score(
    required_ids: List[str],
    provided_ids: List[str],
    ingredient_weights: Dict[str, float]
) -> float:
    if not required_ids:
        return 100.0

    total_weight = sum(ingredient_weights.get(ing_id, 1.0) for ing_id in required_ids)
    correct_weight = 0.0
    extra_penalty = 0.0

    required_set = set(required_ids)
    provided_set = set(provided_ids)

    for ing_id in required_ids:
        if ing_id in provided_set:
            correct_weight += ingredient_weights.get(ing_id, 1.0)

    for ing_id in provided_ids:
        if ing_id not in required_set:
            extra_penalty += ingredient_weights.get(ing_id, 0.5) * 10

    base_score = (correct_weight / total_weight) * 100
    final_score = max(0.0, base_score - extra_penalty)

    return final_score

@app.get("/recipes", response_model=List[Recipe])
async def get_all_recipes():
    return RECIPES

@app.get("/recipes/{recipe_id}", response_model=Recipe)
async def get_recipe(recipe_id: str):
    for recipe in RECIPES:
        if recipe.id == recipe_id:
            return recipe
    raise HTTPException(status_code=404, detail="Recipe not found")

@app.get("/recipes/random", response_model=Recipe)
async def get_random_recipe():
    return random.choice(RECIPES)

@app.post("/score", response_model=ScoreResult)
async def calculate_score(request: ScoreRequest):
    recipe_data = RECIPES_DATA.get(request.recipeId)
    if not recipe_data:
        raise HTTPException(status_code=404, detail="Recipe not found")

    required_ingredients = recipe_data["ingredients"]
    required_ids = [ing["id"] for ing in required_ingredients]
    standard_order = recipe_data["standardOrder"]

    user_steps = sorted(request.steps, key=lambda s: s.order)
    user_order = [step.ingredientId for step in user_steps]
    user_ids_set = set(user_order)

    ingredient_weights: Dict[str, float] = {}
    for ing in required_ingredients:
        if ing["type"] == "base":
            ingredient_weights[ing["id"]] = 2.5
        elif ing["type"] == "mixer":
            ingredient_weights[ing["id"]] = 1.5
        else:
            ingredient_weights[ing["id"]] = 1.0

    ingredient_score = calculate_ingredient_score(required_ids, user_order, ingredient_weights)

    non_garnish_standard = [ing_id for ing_id in standard_order 
                           for ing in required_ingredients 
                           if ing["id"] == ing_id and ing["type"] != "garnish"]
    non_garnish_user = [step.ingredientId for step in user_steps 
                       if step.type != "garnish"]
    sequence_score = calculate_sequence_similarity(non_garnish_user, non_garnish_standard)

    garnish_standard = [ing_id for ing_id in standard_order 
                       for ing in required_ingredients 
                       if ing["id"] == ing_id and ing["type"] == "garnish"]
    garnish_user = [step.ingredientId for step in user_steps if step.type == "garnish"]
    garnish_score = calculate_sequence_similarity(garnish_user, garnish_standard)

    time_bonus = 0.0
    if request.totalTime < 30:
        time_bonus = 10.0
    elif request.totalTime < 60:
        time_bonus = 5.0
    elif request.totalTime < 90:
        time_bonus = 2.0
    elif request.totalTime > 180:
        time_bonus = -5.0

    final_score = (
        ingredient_score * 0.55 +
        sequence_score * 0.30 +
        garnish_score * 0.10 +
        time_bonus
    )

    final_score = max(0.0, min(100.0, final_score))

    missing_ings = [ing["name"] for ing in required_ingredients if ing["id"] not in user_ids_set]
    extra_ings = [step.ingredientName for step in user_steps if step.ingredientId not in set(required_ids)]

    if final_score >= 90:
        stars = 5
        star_color = "gold"
        feedback = "完美调制！你的调酒技巧令人惊叹！每一步都精确无误，这是一杯大师级的作品！时间把控也非常出色！"
    elif final_score >= 80:
        stars = 5
        star_color = "gold"
        feedback = "非常出色！你几乎完美地还原了这杯鸡尾酒。稍加注意细节就能达到极致！"
    elif final_score >= 70:
        stars = 4
        star_color = "silver"
        if missing_ings:
            feedback = f"不错的表现！但缺少了: {', '.join(missing_ings[:3])}。再注意材料的添加顺序会更好！"
        else:
            feedback = "很好！材料都正确了，但添加顺序还有提升空间，继续努力！"
    elif final_score >= 60:
        stars = 4
        star_color = "silver"
        if extra_ings:
            feedback = f"还不错！但添加了不需要的材料: {', '.join(extra_ings[:2])}。请仔细核对配方！"
        else:
            feedback = "基本正确，但顺序需要调整，多练习就会更好！"
    elif final_score >= 50:
        stars = 3
        star_color = "bronze"
        missing_text = f"缺少材料: {', '.join(missing_ings[:2])}。" if missing_ings else ''
        feedback = f"需要继续练习！{missing_text}仔细按照步骤操作会有明显提升！"
    elif final_score >= 30:
        stars = 3
        star_color = "bronze"
        feedback = "还需要多加练习！建议先仔细阅读配方和步骤，确保使用正确的材料和顺序。"
    else:
        stars = 2
        star_color = "bronze"
        feedback = "差距较大！请仔细查看配方说明，确保每一步都按照正确顺序使用正确材料。"

    return ScoreResult(
        accuracy=round(final_score, 1),
        stars=stars,
        starColor=star_color,
        feedback=feedback,
        timeBonus=max(0.0, time_bonus)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
