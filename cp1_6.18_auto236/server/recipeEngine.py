from typing import List, Dict, Any

recipes_database = [
    {
        "id": "1",
        "name": "番茄炒蛋",
        "ingredients": ["西红柿", "鸡蛋", "葱花", "盐", "糖"],
        "cookTime": 15,
        "category": "家常"
    },
    {
        "id": "2",
        "name": "青椒肉丝",
        "ingredients": ["青椒", "猪肉", "生抽", "料酒", "淀粉"],
        "cookTime": 20,
        "category": "家常"
    },
    {
        "id": "3",
        "name": "红烧肉",
        "ingredients": ["五花肉", "冰糖", "生抽", "老抽", "料酒", "八角", "桂皮"],
        "cookTime": 90,
        "category": "硬菜"
    },
    {
        "id": "4",
        "name": "蒜蓉西兰花",
        "ingredients": ["西兰花", "大蒜", "盐", "蚝油"],
        "cookTime": 10,
        "category": "素菜"
    },
    {
        "id": "5",
        "name": "清蒸鲈鱼",
        "ingredients": ["鲈鱼", "生姜", "葱", "蒸鱼豉油", "料酒"],
        "cookTime": 25,
        "category": "海鲜"
    },
    {
        "id": "6",
        "name": "麻婆豆腐",
        "ingredients": ["豆腐", "猪肉末", "豆瓣酱", "花椒", "葱花", "生抽"],
        "cookTime": 20,
        "category": "川菜"
    },
    {
        "id": "7",
        "name": "西红柿鸡蛋面",
        "ingredients": ["西红柿", "鸡蛋", "面条", "葱花", "盐", "香油"],
        "cookTime": 20,
        "category": "主食"
    },
    {
        "id": "8",
        "name": "宫保鸡丁",
        "ingredients": ["鸡胸肉", "花生米", "干辣椒", "花椒", "葱", "姜", "蒜", "生抽", "醋", "糖"],
        "cookTime": 25,
        "category": "川菜"
    },
    {
        "id": "9",
        "name": "酸辣土豆丝",
        "ingredients": ["土豆", "干辣椒", "醋", "盐", "葱花"],
        "cookTime": 15,
        "category": "素菜"
    },
    {
        "id": "10",
        "name": "可乐鸡翅",
        "ingredients": ["鸡翅", "可乐", "生抽", "老抽", "生姜", "料酒"],
        "cookTime": 35,
        "category": "家常"
    },
    {
        "id": "11",
        "name": "蛋炒饭",
        "ingredients": ["米饭", "鸡蛋", "葱花", "盐", "油"],
        "cookTime": 10,
        "category": "主食"
    },
    {
        "id": "12",
        "name": "白灼虾",
        "ingredients": ["虾", "生姜", "葱", "料酒", "生抽"],
        "cookTime": 15,
        "category": "海鲜"
    }
]

def get_recipe_recommendations(user_ingredients: List[str]) -> List[Dict[str, Any]]:
    user_ingredients_clean = [ing.strip() for ing in user_ingredients if ing.strip()]
    
    scored_recipes = []
    
    for recipe in recipes_database:
        recipe_ingredients = recipe["ingredients"]
        
        matched = []
        missing = []
        
        for recipe_ing in recipe_ingredients:
            is_matched = False
            for user_ing in user_ingredients_clean:
                if recipe_ing == user_ing or user_ing in recipe_ing or recipe_ing in user_ing:
                    is_matched = True
                    break
            if is_matched:
                matched.append(recipe_ing)
            else:
                missing.append(recipe_ing)
        
        total = len(recipe_ingredients)
        match_count = len(matched)
        match_percentage = int((match_count / total) * 100) if total > 0 else 0
        
        scored_recipes.append({
            "id": recipe["id"],
            "name": recipe["name"],
            "ingredients": recipe["ingredients"],
            "cookTime": recipe["cookTime"],
            "matchPercentage": match_percentage,
            "missingIngredients": missing,
            "existingIngredients": matched
        })
    
    scored_recipes.sort(key=lambda x: (-x["matchPercentage"], x["cookTime"]))
    
    return scored_recipes[:5]

def get_all_recipes() -> List[Dict[str, Any]]:
    return [
        {
            "id": recipe["id"],
            "name": recipe["name"],
            "ingredients": recipe["ingredients"],
            "cookTime": recipe["cookTime"],
            "matchPercentage": 0,
            "missingIngredients": recipe["ingredients"],
            "existingIngredients": []
        }
        for recipe in recipes_database
    ]
