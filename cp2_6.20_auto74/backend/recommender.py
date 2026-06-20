from typing import List, Dict, Optional
from pydantic import BaseModel


class Nutrition(BaseModel):
    calories: float = 0
    protein: float = 0
    fat: float = 0
    carbs: float = 0


class RecipeIngredient(BaseModel):
    name: str
    quantity_grams: float


class RecipeData(BaseModel):
    id: int
    name: str
    description: str
    cook_time_minutes: int
    ingredients: List[RecipeIngredient]
    steps: List[str]
    nutrition: Nutrition
    image: Optional[str] = None
    dietary_tags: List[str] = []


SAMPLE_RECIPES: List[RecipeData] = [
    RecipeData(
        id=1,
        name="番茄炒蛋",
        description="经典家常菜，酸甜可口，营养丰富",
        cook_time_minutes=15,
        ingredients=[
            RecipeIngredient(name="番茄", quantity_grams=200),
            RecipeIngredient(name="鸡蛋", quantity_grams=150),
            RecipeIngredient(name="葱", quantity_grams=10),
            RecipeIngredient(name="盐", quantity_grams=3),
            RecipeIngredient(name="糖", quantity_grams=5),
        ],
        steps=[
            "番茄洗净切块，鸡蛋打散备用",
            "热锅倒油，倒入蛋液炒至凝固盛出",
            "锅中再加油，放入番茄翻炒出汁",
            "加入盐和糖调味",
            "倒入炒好的鸡蛋翻炒均匀",
            "撒上葱花出锅",
        ],
        nutrition=Nutrition(calories=280, protein=18, fat=18, carbs=12),
        dietary_tags=["high_protein"],
    ),
    RecipeData(
        id=2,
        name="清炒西兰花",
        description="健康素食，清爽脆嫩",
        cook_time_minutes=10,
        ingredients=[
            RecipeIngredient(name="西兰花", quantity_grams=300),
            RecipeIngredient(name="蒜", quantity_grams=10),
            RecipeIngredient(name="盐", quantity_grams=3),
            RecipeIngredient(name="油", quantity_grams=10),
        ],
        steps=[
            "西兰花掰成小朵，洗净沥干",
            "蒜切末备用",
            "热锅倒油，爆香蒜末",
            "放入西兰花快速翻炒",
            "加盐调味，炒至断生即可",
        ],
        nutrition=Nutrition(calories=120, protein=6, fat=7, carbs=10),
        dietary_tags=["vegetarian", "low_cal"],
    ),
    RecipeData(
        id=3,
        name="鸡胸肉沙拉",
        description="高蛋白低卡，健身优选",
        cook_time_minutes=20,
        ingredients=[
            RecipeIngredient(name="鸡胸肉", quantity_grams=200),
            RecipeIngredient(name="生菜", quantity_grams=100),
            RecipeIngredient(name="番茄", quantity_grams=100),
            RecipeIngredient(name="黄瓜", quantity_grams=100),
            RecipeIngredient(name="橄榄油", quantity_grams=10),
            RecipeIngredient(name="柠檬汁", quantity_grams=10),
            RecipeIngredient(name="盐", quantity_grams=2),
            RecipeIngredient(name="黑胡椒", quantity_grams=1),
        ],
        steps=[
            "鸡胸肉用盐和黑胡椒腌制10分钟",
            "平底锅煎熟鸡胸肉，切片备用",
            "生菜洗净撕成小块",
            "番茄、黄瓜切片",
            "所有材料放入大碗中",
            "淋上橄榄油和柠檬汁，拌匀即可",
        ],
        nutrition=Nutrition(calories=250, protein=35, fat=10, carbs=8),
        dietary_tags=["high_protein", "low_cal"],
    ),
    RecipeData(
        id=4,
        name="土豆炖牛肉",
        description="经典硬菜，香浓入味",
        cook_time_minutes=60,
        ingredients=[
            RecipeIngredient(name="牛肉", quantity_grams=300),
            RecipeIngredient(name="土豆", quantity_grams=200),
            RecipeIngredient(name="胡萝卜", quantity_grams=100),
            RecipeIngredient(name="洋葱", quantity_grams=80),
            RecipeIngredient(name="姜", quantity_grams=10),
            RecipeIngredient(name="蒜", quantity_grams=10),
            RecipeIngredient(name="生抽", quantity_grams=20),
            RecipeIngredient(name="老抽", quantity_grams=5),
            RecipeIngredient(name="盐", quantity_grams=3),
        ],
        steps=[
            "牛肉切块焯水去血沫",
            "土豆、胡萝卜切块，洋葱切片",
            "热锅倒油，爆香姜蒜",
            "放入牛肉翻炒，加生抽老抽",
            "加水没过牛肉，大火烧开转小火炖40分钟",
            "加入土豆和胡萝卜，继续炖20分钟",
            "加盐调味，大火收汁",
        ],
        nutrition=Nutrition(calories=450, protein=40, fat=20, carbs=25),
        dietary_tags=["high_protein"],
    ),
    RecipeData(
        id=5,
        name="蒜蓉菠菜",
        description="简单快手，营养丰富",
        cook_time_minutes=8,
        ingredients=[
            RecipeIngredient(name="菠菜", quantity_grams=300),
            RecipeIngredient(name="蒜", quantity_grams=15),
            RecipeIngredient(name="盐", quantity_grams=3),
            RecipeIngredient(name="油", quantity_grams=8),
        ],
        steps=[
            "菠菜洗净切段",
            "蒜切末备用",
            "热锅倒油，爆香蒜末",
            "放入菠菜大火快炒",
            "加盐调味，炒软即可出锅",
        ],
        nutrition=Nutrition(calories=90, protein=5, fat=6, carbs=7),
        dietary_tags=["vegetarian", "low_cal"],
    ),
    RecipeData(
        id=6,
        name="豆腐菌菇汤",
        description="清淡鲜美，素食养胃",
        cook_time_minutes=25,
        ingredients=[
            RecipeIngredient(name="豆腐", quantity_grams=200),
            RecipeIngredient(name="香菇", quantity_grams=50),
            RecipeIngredient(name="金针菇", quantity_grams=100),
            RecipeIngredient(name="青菜", quantity_grams=50),
            RecipeIngredient(name="姜", quantity_grams=5),
            RecipeIngredient(name="盐", quantity_grams=3),
            RecipeIngredient(name="香油", quantity_grams=3),
        ],
        steps=[
            "豆腐切块，香菇切片，金针菇去根撕开",
            "青菜洗净，姜切丝",
            "锅中加水烧开，放入姜丝",
            "加入豆腐和香菇煮5分钟",
            "加入金针菇煮3分钟",
            "放入青菜和盐，煮1分钟",
            "滴入香油即可出锅",
        ],
        nutrition=Nutrition(calories=150, protein=12, fat=8, carbs=10),
        dietary_tags=["vegetarian", "low_cal"],
    ),
    RecipeData(
        id=7,
        name="香煎三文鱼",
        description="高蛋白健康餐，简单美味",
        cook_time_minutes=15,
        ingredients=[
            RecipeIngredient(name="三文鱼", quantity_grams=200),
            RecipeIngredient(name="柠檬", quantity_grams=20),
            RecipeIngredient(name="盐", quantity_grams=2),
            RecipeIngredient(name="黑胡椒", quantity_grams=1),
            RecipeIngredient(name="橄榄油", quantity_grams=10),
            RecipeIngredient(name="迷迭香", quantity_grams=2),
        ],
        steps=[
            "三文鱼用厨房纸吸干水分",
            "两面撒盐和黑胡椒腌制5分钟",
            "平底锅倒油烧热",
            "三文鱼皮朝下放入锅中",
            "煎至金黄翻面，每面约3分钟",
            "挤上柠檬汁，撒上迷迭香",
        ],
        nutrition=Nutrition(calories=380, protein=32, fat=25, carbs=2),
        dietary_tags=["high_protein", "low_cal"],
    ),
    RecipeData(
        id=8,
        name="蛋炒饭",
        description="快手主食，粒粒分明",
        cook_time_minutes=12,
        ingredients=[
            RecipeIngredient(name="米饭", quantity_grams=300),
            RecipeIngredient(name="鸡蛋", quantity_grams=100),
            RecipeIngredient(name="葱", quantity_grams=10),
            RecipeIngredient(name="盐", quantity_grams=3),
            RecipeIngredient(name="油", quantity_grams=15),
        ],
        steps=[
            "鸡蛋打散，葱切葱花",
            "热锅倒油，倒入蛋液炒散盛出",
            "锅中再加油，倒入米饭翻炒",
            "炒至米饭粒粒分明",
            "加入炒好的鸡蛋继续翻炒",
            "加盐调味，撒上葱花出锅",
        ],
        nutrition=Nutrition(calories=420, protein=12, fat=16, carbs=58),
        dietary_tags=["vegetarian"],
    ),
]


DIETARY_FILTERS = {
    "low_cal": "low_cal",
    "high_protein": "high_protein",
    "vegetarian": "vegetarian",
}


def calculate_match_score(user_ingredients: List[str], recipe_ingredients: List[RecipeIngredient]) -> float:
    if not recipe_ingredients:
        return 0.0

    user_lower = {ing.lower() for ing in user_ingredients}
    matched = 0
    total = len(recipe_ingredients)

    for recipe_ing in recipe_ingredients:
        if recipe_ing.name.lower() in user_lower:
            matched += 1

    return (matched / total) * 100 if total > 0 else 0.0


def filter_by_dietary(recipes: List[RecipeData], dietary_filter: Optional[str]) -> List[RecipeData]:
    if not dietary_filter or dietary_filter not in DIETARY_FILTERS:
        return recipes

    tag = DIETARY_FILTERS[dietary_filter]
    return [r for r in recipes if tag in r.dietary_tags]


def recommend_recipes(
    user_ingredients: List[str],
    dietary_filter: Optional[str] = None,
    top_n: int = 10
) -> List[Dict]:
    recipes = filter_by_dietary(SAMPLE_RECIPES, dietary_filter)

    scored_recipes = []
    for recipe in recipes:
        score = calculate_match_score(user_ingredients, recipe.ingredients)
        scored_recipes.append({
            "id": recipe.id,
            "name": recipe.name,
            "description": recipe.description,
            "cook_time_minutes": recipe.cook_time_minutes,
            "ingredients": [ing.model_dump() for ing in recipe.ingredients],
            "steps": recipe.steps,
            "nutrition": recipe.nutrition.model_dump(),
            "image": recipe.image,
            "dietary_tags": recipe.dietary_tags,
            "match_score": round(score, 1),
        })

    scored_recipes.sort(key=lambda x: x["match_score"], reverse=True)
    return scored_recipes[:top_n]


def get_all_recipes(dietary_filter: Optional[str] = None) -> List[Dict]:
    recipes = filter_by_dietary(SAMPLE_RECIPES, dietary_filter)
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "cook_time_minutes": r.cook_time_minutes,
            "ingredients": [ing.model_dump() for ing in r.ingredients],
            "steps": r.steps,
            "nutrition": r.nutrition.model_dump(),
            "image": r.image,
            "dietary_tags": r.dietary_tags,
        }
        for r in recipes
    ]


def get_recipe_by_id(recipe_id: int) -> Optional[Dict]:
    for recipe in SAMPLE_RECIPES:
        if recipe.id == recipe_id:
            return {
                "id": recipe.id,
                "name": recipe.name,
                "description": recipe.description,
                "cook_time_minutes": recipe.cook_time_minutes,
                "ingredients": [ing.model_dump() for ing in recipe.ingredients],
                "steps": recipe.steps,
                "nutrition": recipe.nutrition.model_dump(),
                "image": recipe.image,
                "dietary_tags": recipe.dietary_tags,
            }
    return None


def calculate_nutrition(ingredients: List[Dict]) -> Nutrition:
    total_nutrition = Nutrition()
    for ing in ingredients:
        nutrition = ing.get("nutrition_per_100g", {})
        quantity = ing.get("quantity_grams", 0)
        factor = quantity / 100.0 if quantity > 0 else 0

        total_nutrition.calories += nutrition.get("calories", 0) * factor
        total_nutrition.protein += nutrition.get("protein", 0) * factor
        total_nutrition.fat += nutrition.get("fat", 0) * factor
        total_nutrition.carbs += nutrition.get("carbs", 0) * factor

    return total_nutrition
