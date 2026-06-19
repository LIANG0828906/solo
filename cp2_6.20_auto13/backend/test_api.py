import urllib.request
import json

base = "http://localhost:8001"

def get(path):
    r = urllib.request.urlopen(base + path)
    return json.loads(r.read())

print("=== Recipe List ===")
data = get("/api/recipes?page=1&page_size=3")
print(f"Total: {data['total']}")
for item in data["items"]:
    print(f"  - {item['title']} ({item['difficulty']}) avg_rating={item['avg_rating']}")

print("\n=== Recipe Detail ===")
first_id = data["items"][0]["id"]
detail = get(f"/api/recipes/{first_id}")
print(f"Title: {detail['title']}")
print(f"Description: {detail['description']}")
print(f"Ingredients: {len(detail['ingredients'])}")
for ing in detail["ingredients"]:
    print(f"  - {ing['name']} {ing['amount']}{ing['unit']}")
print(f"Steps: {len(detail['steps'])}")
for step in detail["steps"]:
    print(f"  - {step['title']}: {step['content'][:30]}...")
print(f"Nutrition: {detail['nutrition']}")

print("\n=== Rating Distribution ===")
dist = get(f"/api/recipes/{first_id}/rating-distribution")
print(dist)

print("\n=== Nutrition Calculate ===")
req = urllib.request.Request(
    base + "/api/nutrition/calculate",
    data=json.dumps({"ingredients": [{"name": "鸡蛋", "amount": 2, "unit": "个"}, {"name": "西红柿", "amount": 300, "unit": "g"}]}).encode(),
    headers={"Content-Type": "application/json"},
)
r = urllib.request.urlopen(req)
print(json.loads(r.read()))

print("\n=== Replacements ===")
reps = get("/api/ingredients/%E9%B8%A1%E8%9B%8B/replacements")
for rep in reps:
    print(f"  - {rep['name']}: {rep['calories']} cal")

print("\n=== Favorites ===")
folders = get("/api/favorites")
for f in folders:
    print(f"  - {f['name']} ({f['recipe_count']} recipes)")

print("\nAll tests passed!")
