import urllib.request
import json

BASE = "http://127.0.0.1:8001"

def get(url):
    r = urllib.request.urlopen(BASE + url)
    return json.loads(r.read().decode())

def post(url, data):
    req = urllib.request.Request(BASE + url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'})
    r = urllib.request.urlopen(req)
    return json.loads(r.read().decode())

print("=== 测试根路径 ===")
print(get("/"))

print("\n=== 测试菜谱列表 ===")
recipes = get("/api/recipes")
print(f"菜谱数量: {len(recipes)}")
for recipe in recipes:
    print(f"  - {recipe['name']} ({recipe['cooking_time']}分钟, {len(recipe['ingredients'])}种食材)")

print("\n=== 测试单个菜谱 ===")
if recipes:
    rid = recipes[0]['id']
    recipe = get(f"/api/recipes/{rid}")
    print(f"菜谱: {recipe['name']}")
    print(f"步骤数: {len(recipe['steps'])}")
    for ing in recipe['ingredients']:
        print(f"  食材: {ing['name']} - {ing['quantity']}{ing['unit']} [{ing['category']}]")

print("\n=== 测试库存列表 ===")
inventories = get("/api/inventory")
print(f"库存项数量: {len(inventories)}")
for inv in inventories:
    print(f"  - {inv['name']}: {inv['quantity']}{inv['unit']} [{inv['category']}]")

print("\n=== 测试食材名称列表 ===")
names = get("/api/ingredients/names")
print(f"唯一食材名称数量: {len(names)}")
print(f"前10个: {names[:10]}")

print("\n=== 测试搜索功能 ===")
search_results = get("/api/recipes?search=番茄")
print(f"搜索'番茄'结果数: {len(search_results)}")
for r in search_results:
    print(f"  - {r['name']}")

print("\n=== 测试排序功能 ===")
sorted_recipes = get("/api/recipes?sort_by=cooking_time&order=asc")
print(f"按烹饪时间升序:")
for r in sorted_recipes[:3]:
    print(f"  - {r['name']}: {r['cooking_time']}分钟")

print("\n=== 测试生成购物清单 ===")
recipe_ids = [r['id'] for r in recipes[:2]]
shopping_list = post("/api/shopping-list/generate", {"recipe_ids": recipe_ids})
print(f"购物清单项目数: {shopping_list['total_count']}")
for item in shopping_list['items']:
    print(f"  - {item['name']}: {item['quantity']}{item['unit']} [{item['category']}]")

print("\n=== 测试创建库存 ===")
new_inv = post("/api/inventory", {"name": "卷心菜", "quantity": "1", "unit": "颗"})
print(f"创建库存: {new_inv['name']} - 分类: {new_inv['category']}")

print("\n=== 所有测试通过！ ===")
