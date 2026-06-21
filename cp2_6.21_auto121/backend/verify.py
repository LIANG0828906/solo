import requests
import sys

BASE_URL = "http://127.0.0.1:8001"

def test_case(name, func):
    try:
        result = func()
        print(f"[PASS] {name}")
        return True
    except Exception as e:
        print(f"[FAIL] {name}: {e}")
        return False

def test1():
    r = requests.get(f"{BASE_URL}/api/furniture")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 35, f"期望35件家具，实际{len(data)}"
    assert 'style_tags' in data[0], "缺少style_tags字段"
    assert isinstance(data[0]['style_tags'], list), "style_tags应为列表"
    assert len(data[0]['style_tags']) >= 1, "style_tags至少包含一个风格"
    return True

def test2():
    r = requests.get(f"{BASE_URL}/api/furniture")
    data = r.json()
    soft_decor = [f for f in data if f['id'] in [31, 32, 33, 34, 35]]
    assert len(soft_decor) == 5, "缺少软装元素"
    categories = set(f['category'] for f in soft_decor)
    assert '窗帘' in categories, "缺少窗帘"
    assert '抱枕' in categories, "缺少抱枕"
    assert '花瓶' in categories, "缺少花瓶"
    return True

def test3():
    r = requests.get(f"{BASE_URL}/api/styles")
    data = r.json()
    assert len(data) == 5, f"期望5种风格，实际{len(data)}"
    
    style_names = {s['name'] for s in data}
    expected = {'现代', '北欧', '工业', '日式', '复古'}
    assert style_names == expected, f"风格名称不匹配: {style_names}"
    
    modern = next(s for s in data if s['name'] == '现代')
    assert '#2E7D32' in modern['color_palette'], "现代风格缺少墨绿色"
    
    nordic = next(s for s in data if s['name'] == '北欧')
    assert '#7BA3A8' in nordic['color_palette'], "北欧风格缺少浅灰蓝"
    
    industrial = next(s for s in data if s['name'] == '工业')
    assert '#CD5C5C' in industrial['color_palette'], "工业风格缺少砖红"
    
    japanese = next(s for s in data if s['name'] == '日式')
    assert '#556B2F' in japanese['color_palette'], "日式风格缺少竹绿"
    
    vintage = next(s for s in data if s['name'] == '复古')
    assert '#8B0000' in vintage['color_palette'], "复古风格缺少酒红"
    
    return True

def test4():
    design_data = {
        "name": "测试设计",
        "style_id": 1,
        "room_width": 5.0,
        "room_height": 4.0,
        "furniture_items": [
            {"furniture_id": 1, "position_x": 1.0, "position_y": 1.0}
        ]
    }
    r = requests.post(f"{BASE_URL}/api/designs", json=design_data)
    assert r.status_code == 200
    created = r.json()
    design_id = created['id']
    
    update_data = {
        "name": "更新后的设计",
        "style_id": 2,
        "room_width": 6.0,
        "room_height": 5.0,
        "furniture_items": [
            {"furniture_id": 2, "position_x": 1.0, "position_y": 1.0}
        ]
    }
    r = requests.put(f"{BASE_URL}/api/designs/{design_id}", json=update_data)
    assert r.status_code == 200
    updated = r.json()
    assert updated['name'] == "更新后的设计"
    assert updated['style_name'] == "北欧"
    
    r = requests.get(f"{BASE_URL}/api/designs/style/2")
    assert r.status_code == 200
    designs_by_style = r.json()
    assert len(designs_by_style) >= 1
    
    r = requests.delete(f"{BASE_URL}/api/designs/{design_id}")
    assert r.status_code == 200
    
    r = requests.get(f"{BASE_URL}/api/designs/{design_id}")
    assert r.status_code == 404
    
    return True

def test5():
    r = requests.get(f"{BASE_URL}/")
    assert r.status_code == 200
    data = r.json()
    assert 'endpoints' in data
    assert 'PUT /api/designs/{id}' in str(data['endpoints'])
    assert 'GET /api/designs/style/{style_id}' in str(data['endpoints'])
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("开始验证后端功能")
    print("=" * 60)
    
    tests = [
        ("1. Furniture模型style_tags字段", test1),
        ("2. 软装元素数据(窗帘、抱枕、花瓶)", test2),
        ("3. 5种风格色板和描述", test3),
        ("4. 设计方案CRUD(更新、删除、按风格查询)", test4),
        ("5. API端点文档", test5),
    ]
    
    passed = 0
    for name, func in tests:
        if test_case(name, func):
            passed += 1
    
    print("\n" + "=" * 60)
    print(f"测试结果: {passed}/{len(tests)} 通过")
    print("=" * 60)
    
    if passed == len(tests):
        print("\n所有验证通过！")
        sys.exit(0)
    else:
        print(f"\n有 {len(tests) - passed} 项测试失败")
        sys.exit(1)
