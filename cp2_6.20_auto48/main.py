from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import random
from datetime import datetime

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

RECIPES = [
    Recipe(
        id="whiskey-sour",
        name="威士忌酸",
        description="经典威士忌鸡尾酒，酸甜平衡，口感清爽",
        glassType="古典杯",
        ingredients=[
            Ingredient(id="whiskey", name="波本威士忌", type="base", color="#d4a574", abv=40, amount=60, unit="ml", labelColor="#f4d03f"),
            Ingredient(id="lime-juice", name="青柠汁", type="mixer", color="#abebc6", abv=0, amount=30, unit="ml", labelColor="#2ecc71"),
            Ingredient(id="simple-syrup", name="糖浆", type="mixer", color="#fef9e7", abv=0, amount=20, unit="ml", labelColor="#f7dc6f"),
            Ingredient(id="bitters", name="安格斯特拉苦精", type="mixer", color="#7b241c", abv=44.7, amount=2, unit="dash", labelColor="#922b21"),
            Ingredient(id="cherry", name="樱桃", type="garnish", color="#e74c3c", abv=0, amount=1, unit="颗"),
            Ingredient(id="lemon", name="柠檬片", type="garnish", color="#f7dc6f", abv=0, amount=1, unit="片"),
        ],
        steps=[
            "将波本威士忌倒入调酒壶",
            "加入青柠汁和糖浆",
            "加入安格斯特拉苦精",
            "加入冰块摇匀",
            "过滤倒入古典杯",
            "用樱桃和柠檬片装饰"
        ]
    ),
    Recipe(
        id="mojito",
        name="莫吉托",
        description="清爽的朗姆酒鸡尾酒，带有薄荷和青柠的清新香气",
        glassType="高球杯",
        ingredients=[
            Ingredient(id="rum", name="朗姆酒", type="base", color="#f5cba7", abv=38, amount=60, unit="ml", labelColor="#e67e22"),
            Ingredient(id="lime-juice", name="青柠汁", type="mixer", color="#abebc6", abv=0, amount=30, unit="ml", labelColor="#2ecc71"),
            Ingredient(id="simple-syrup", name="糖浆", type="mixer", color="#fef9e7", abv=0, amount=20, unit="ml", labelColor="#f7dc6f"),
            Ingredient(id="mint-leaf", name="薄荷叶", type="garnish", color="#27ae60", abv=0, amount=8, unit="片"),
            Ingredient(id="cola", name="可乐", type="mixer", color="#4a235a", abv=0, amount=90, unit="ml", labelColor="#884ea0"),
            Ingredient(id="lemon", name="柠檬片", type="garnish", color="#f7dc6f", abv=0, amount=1, unit="片"),
        ],
        steps=[
            "将薄荷叶放入杯底轻轻捣碎",
            "加入青柠汁和糖浆",
            "倒入朗姆酒",
            "加入冰块搅拌",
            "用可乐补满",
            "用薄荷叶和柠檬片装饰"
        ]
    ),
    Recipe(
        id="manhattan",
        name="曼哈顿",
        description="经典威士忌鸡尾酒，带有味美思的香甜风味",
        glassType="鸡尾酒杯",
        ingredients=[
            Ingredient(id="whiskey", name="波本威士忌", type="base", color="#d4a574", abv=40, amount=60, unit="ml", labelColor="#f4d03f"),
            Ingredient(id="vermouth", name="味美思", type="mixer", color="#a93226", abv=18, amount=30, unit="ml", labelColor="#c0392b"),
            Ingredient(id="bitters", name="安格斯特拉苦精", type="mixer", color="#7b241c", abv=44.7, amount=2, unit="dash", labelColor="#922b21"),
            Ingredient(id="cherry", name="樱桃", type="garnish", color="#e74c3c", abv=0, amount=1, unit="颗"),
        ],
        steps=[
            "将威士忌倒入调酒壶",
            "加入味美思和苦精",
            "加入冰块搅拌均匀",
            "过滤倒入冰镇鸡尾酒杯",
            "用樱桃装饰"
        ]
    ),
    Recipe(
        id="martini",
        name="马天尼",
        description="经典金酒鸡尾酒，优雅而有力",
        glassType="鸡尾酒杯",
        ingredients=[
            Ingredient(id="gin", name="金酒", type="base", color="#d5f5e3", abv=37.5, amount=60, unit="ml", labelColor="#27ae60"),
            Ingredient(id="vermouth", name="味美思", type="mixer", color="#a93226", abv=18, amount=15, unit="ml", labelColor="#c0392b"),
            Ingredient(id="olive", name="橄榄", type="garnish", color="#1e8449", abv=0, amount=2, unit="颗"),
        ],
        steps=[
            "将金酒和味美思倒入调酒杯",
            "加入冰块搅拌30秒",
            "过滤倒入冰镇鸡尾酒杯",
            "用橄榄装饰"
        ]
    ),
    Recipe(
        id="long-island",
        name="长岛冰茶",
        description="强力混合鸡尾酒，多种基酒的完美融合",
        glassType="高球杯",
        ingredients=[
            Ingredient(id="vodka", name="伏特加", type="base", color="#e8e8e8", abv=40, amount=15, unit="ml", labelColor="#3498db"),
            Ingredient(id="rum", name="朗姆酒", type="base", color="#f5cba7", abv=38, amount=15, unit="ml", labelColor="#e67e22"),
            Ingredient(id="gin", name="金酒", type="base", color="#d5f5e3", abv=37.5, amount=15, unit="ml", labelColor="#27ae60"),
            Ingredient(id="tequila", name="龙舌兰", type="base", color="#f9e79f", abv=38, amount=15, unit="ml", labelColor="#f1c40f"),
            Ingredient(id="triple-sec", name="橙味力娇酒", type="mixer", color="#f9e79f", abv=30, amount=15, unit="ml", labelColor="#f39c12"),
            Ingredient(id="lime-juice", name="青柠汁", type="mixer", color="#abebc6", abv=0, amount=25, unit="ml", labelColor="#2ecc71"),
            Ingredient(id="simple-syrup", name="糖浆", type="mixer", color="#fef9e7", abv=0, amount=15, unit="ml", labelColor="#f7dc6f"),
            Ingredient(id="cola", name="可乐", type="mixer", color="#4a235a", abv=0, amount=30, unit="ml", labelColor="#884ea0"),
            Ingredient(id="lemon", name="柠檬片", type="garnish", color="#f7dc6f", abv=0, amount=1, unit="片"),
        ],
        steps=[
            "将所有基酒倒入调酒壶",
            "加入橙味力娇酒、青柠汁和糖浆",
            "加入冰块摇匀",
            "过滤倒入加冰的高球杯",
            "用可乐补满",
            "用柠檬片装饰"
        ]
    )
]

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
    recipe = None
    for r in RECIPES:
        if r.id == request.recipeId:
            recipe = r
            break
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    required_ingredients = set(ing.id for ing in recipe.ingredients)
    provided_ingredients = set(step.ingredientId for step in request.steps)
    
    correct_ingredients = required_ingredients.intersection(provided_ingredients)
    extra_ingredients = provided_ingredients - required_ingredients
    missing_ingredients = required_ingredients - provided_ingredients
    
    base_score = len(correct_ingredients) / len(required_ingredients) * 100
    
    if extra_ingredients:
        base_score -= len(extra_ingredients) * 10
    
    order_correct = True
    recipe_order = [ing.id for ing in recipe.ingredients if ing.type != 'garnish']
    provided_order = [step.ingredientId for step in request.steps if step.type != 'garnish']
    
    if len(provided_order) > 0 and len(recipe_order) > 0:
        for i, ing_id in enumerate(provided_order):
            if i < len(recipe_order) and ing_id != recipe_order[i]:
                order_correct = False
                break
    
    if not order_correct:
        base_score -= 10
    
    time_bonus = 0
    if request.totalTime < 30:
        time_bonus = 10
    elif request.totalTime < 60:
        time_bonus = 5
    elif request.totalTime < 90:
        time_bonus = 2
    
    base_score += time_bonus
    accuracy = max(0, min(100, base_score))
    
    if accuracy >= 90:
        stars = 5
        star_color = "gold"
        feedback = "完美调制！你的调酒技巧令人惊叹！每一步都精确无误，这是一杯大师级的作品！"
    elif accuracy >= 70:
        stars = 4
        star_color = "silver"
        feedback = "出色表现！你已经掌握了基本的调酒技巧，再注意一些细节就能达到完美！"
    elif accuracy >= 50:
        stars = 3
        star_color = "bronze"
        feedback = "不错的尝试！继续练习，注意材料的顺序和用量，你会越来越好的！"
    else:
        stars = 2
        star_color = "bronze"
        feedback = "还需要多加练习！仔细查看配方，确保使用正确的材料和顺序。"
    
    return ScoreResult(
        accuracy=round(accuracy, 1),
        stars=stars,
        starColor=star_color,
        feedback=feedback,
        timeBonus=time_bonus
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
