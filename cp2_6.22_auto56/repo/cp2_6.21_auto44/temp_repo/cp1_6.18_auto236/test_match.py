import sys
sys.path.insert(0, 'd:/Pro/tasks/auto236/server')
from recipeEngine import get_recipe_recommendations

result = get_recipe_recommendations(["西红柿", "鸡蛋", "青椒"])

for recipe in result:
    print(f"{recipe['name']}: {recipe['matchPercentage']}%")
    print(f"  已有: {recipe['existingIngredients']}")
    print(f"  缺少: {recipe['missingIngredients']}")
    print()
