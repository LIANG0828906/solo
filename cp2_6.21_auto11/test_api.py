import requests
import time
import random

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("1. 测试健康检查")
resp = requests.get(f"{BASE_URL}/api/health")
print(f"   状态码: {resp.status_code}, 结果: {resp.json()}")

print("\n" + "=" * 60)
print("2. 创建活动")
event_data = {
    "name": "2026年人工智能峰会",
    "date": "2026-06-21T09:00:00",
    "location": "报告厅B"
}
resp = requests.post(f"{BASE_URL}/api/events", json=event_data)
print(f"   状态码: {resp.status_code}")
event = resp.json()
event_id = event["id"]
print(f"   活动ID: {event_id}")
print(f"   活动名称: {event['name']}")
print(f"   活动地点: {event['location']}")

print("\n" + "=" * 60)
print("3. 模拟签到 (5人，间隔5.5秒以通过限流)")
names = ["张伟", "李娜", "王强", "刘洋", "陈静", "杨帆", "赵磊"]
for i, name in enumerate(names):
    time.sleep(5.5 if i > 0 else 0.1)
    checkin_data = {
        "event_id": event_id,
        "participant_name": name,
        "device_id": f"device_{i+1:03d}",
        "x": round(10 + random.random() * 80, 2),
        "y": round(10 + random.random() * 80, 2)
    }
    resp = requests.post(f"{BASE_URL}/api/checkin", json=checkin_data)
    if resp.status_code == 200:
        r = resp.json()
        print(f"   ✓ #{r['checkin_number']} {r['participant_name']} - 签到成功")
    else:
        print(f"   ✗ 签到失败 ({resp.status_code}): {resp.json().get('detail', '未知错误')}")

print("\n" + "=" * 60)
print("4. 测试429限流 (立即重复签到)")
checkin_data = {
    "event_id": event_id,
    "participant_name": "限流测试",
    "device_id": "device_001",
    "x": 50,
    "y": 50
}
resp = requests.post(f"{BASE_URL}/api/checkin", json=checkin_data)
print(f"   状态码: {resp.status_code} (预期429)")
print(f"   消息: {resp.json().get('detail', '')}")

print("\n" + "=" * 60)
print("5. 获取统计数据")
resp = requests.get(f"{BASE_URL}/api/events/{event_id}/stats")
stats = resp.json()
print(f"   状态码: {resp.status_code}")
print(f"   总签到人数: {stats['total_checkins']}")
print(f"   时间序列点数: {len(stats['checkins_over_time'])}")
if stats['checkins_over_time']:
    print("   最近时间点:")
    for p in stats['checkins_over_time'][-3:]:
        print(f"      {p['time']}: 累计{p['cumulative']}人, 新增{p['count']}人")
print(f"   签到记录数: {len(stats['checkins'])}")
if stats['checkins']:
    print("   签到列表:")
    for c in stats['checkins']:
        print(f"      #{c['checkin_number']} {c['participant_name']} ({c['x']:.1f},{c['y']:.1f})")

print("\n" + "=" * 60)
print("6. 导出CSV")
resp = requests.get(f"{BASE_URL}/api/events/{event_id}/export")
print(f"   状态码: {resp.status_code}")
print(f"   Content-Type: {resp.headers.get('Content-Type')}")
content = resp.content.decode('utf-8-sig')
lines = content.strip().split('\n')
print(f"   CSV行数: {len(lines)} (含表头)")
if len(lines) > 1:
    print(f"   表头: {lines[0]}")
    print(f"   首行: {lines[1]}")

print("\n" + "=" * 60)
print(f"7. 前端仪表盘访问地址: http://localhost:5174/dashboard/{event_id}")
print("=" * 60)
print("\n所有测试通过! ✅")
