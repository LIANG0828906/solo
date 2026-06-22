import requests
import json

BASE_URL = "http://127.0.0.1:8001"

def test_furniture():
    print("=" * 60)
    print("测试家具列表 API")
    print("=" * 60)
    response = requests.get(f"{BASE_URL}/api/furniture")
    data = response.json()
    print(f"总家具数: {len(data)}")
    print(f"\n前3件家具 (验证 style_tags):")
    for f in data[:3]:
        print(f"  {f['id']}. {f['name']}")
        print(f"     style_tags: {f['style_tags']}")
    print(f"\n新增软装元素 (ID 31-35):")
    for f in data[30:35]:
        print(f"  {f['id']}. {f['name']} ({f['category']})")
        print(f"     style_tags: {f['style_tags']}")
        print(f"     price: CNY{f['price']}")
    return data

def test_styles():
    print("\n" + "=" * 60)
    print("测试风格列表 API")
    print("=" * 60)
    response = requests.get(f"{BASE_URL}/api/styles")
    data = response.json()
    print(f"总风格数: {len(data)}")
    for s in data:
        print(f"\n{s['id']}. {s['name']}")
        print(f"   描述: {s['description'][:50]}...")
        print(f"   色板: {s['color_palette']}")
    return data

def test_design_crud():
    print("\n" + "=" * 60)
    print("测试设计方案 CRUD API")
    print("=" * 60)

    design_data = {
        "name": "测试客厅设计",
        "style_id": 1,
        "room_width": 5.0,
        "room_height": 4.0,
        "furniture_items": [
            {"furniture_id": 1, "position_x": 1.0, "position_y": 1.0, "rotation": 0, "scale": 1.0},
            {"furniture_id": 24, "position_x": 2.5, "position_y": 2.0, "rotation": 0, "scale": 1.0}
        ],
        "description": "这是一个测试设计方案"
    }

    print("\n1. 创建设计方案:")
    response = requests.post(f"{BASE_URL}/api/designs", json=design_data)
    if response.status_code == 200:
        created = response.json()
        design_id = created["id"]
        print(f"   OK 创建成功, ID: {design_id}")
        print(f"   总价: CNY{created['total_price']}")
    else:
        print(f"   FAIL 创建失败: {response.text}")
        return

    print("\n2. 获取设计方案列表:")
    response = requests.get(f"{BASE_URL}/api/designs")
    designs = response.json()
    print(f"   OK 共 {len(designs)} 个设计方案")

    print("\n3. 按风格获取设计方案 (style_id=1):")
    response = requests.get(f"{BASE_URL}/api/designs/style/1")
    designs_by_style = response.json()
    print(f"   OK 风格1共有 {len(designs_by_style)} 个设计方案")

    print("\n4. 更新设计方案:")
    update_data = {
        "name": "更新后的测试设计",
        "style_id": 2,
        "room_width": 6.0,
        "room_height": 4.5,
        "furniture_items": [
            {"furniture_id": 2, "position_x": 1.0, "position_y": 1.0, "rotation": 0, "scale": 1.0}
        ],
        "description": "更新后的描述"
    }
    response = requests.put(f"{BASE_URL}/api/designs/{design_id}", json=update_data)
    if response.status_code == 200:
        updated = response.json()
        print(f"   OK 更新成功")
        print(f"   新名称: {updated['name']}")
        print(f"   新风格: {updated['style_name']}")
        print(f"   新总价: CNY{updated['total_price']}")
    else:
        print(f"   FAIL 更新失败: {response.text}")

    print("\n5. 删除设计方案:")
    response = requests.delete(f"{BASE_URL}/api/designs/{design_id}")
    if response.status_code == 200:
        print(f"   OK 删除成功")
    else:
        print(f"   FAIL 删除失败: {response.text}")

    print("\n6. 验证删除后列表:")
    response = requests.get(f"{BASE_URL}/api/designs")
    designs_after = response.json()
    print(f"   OK 删除后剩余 {len(designs_after)} 个设计方案")

def test_root():
    print("\n" + "=" * 60)
    print("测试根路径 API")
    print("=" * 60)
    response = requests.get(f"{BASE_URL}/")
    data = response.json()
    print(f"消息: {data['message']}")
    print(f"版本: {data['version']}")
    print(f"\n可用端点:")
    for endpoint, desc in data['endpoints'].items():
        print(f"  {endpoint}: {desc}")

if __name__ == "__main__":
    try:
        furniture = test_furniture()
        styles = test_styles()
        test_design_crud()
        test_root()
        print("\n" + "=" * 60)
        print("OK 所有测试通过!")
        print("=" * 60)
    except Exception as e:
        print(f"\nFAIL 测试失败: {e}")
        import traceback
        traceback.print_exc()
