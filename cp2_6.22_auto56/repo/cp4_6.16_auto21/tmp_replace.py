import json

with open(r'd:\P\tasks\auto21\src\data\defaultRecipes.json', 'r', encoding='utf-8') as f:
    recipes = json.load(f)

for recipe in recipes:
    recipe_id = recipe['id']
    recipe['coverImage'] = f'https://picsum.photos/seed/{recipe_id}/600/400'

with open(r'd:\P\tasks\auto21\src\data\defaultRecipes.json', 'w', encoding='utf-8') as f:
    json.dump(recipes, f, ensure_ascii=False, indent=2)

print(f'成功替换 {len(recipes)} 道菜的 coverImage')
for r in recipes:
    print('id=' + r['id'] + ': ' + r['coverImage'])
