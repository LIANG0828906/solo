import urllib.request
import json


def get(url):
    response = urllib.request.urlopen(url)
    return json.loads(response.read().decode())


def post(url, data=None, headers=None):
    if data:
        data = json.dumps(data).encode()
    req = urllib.request.Request(url, data=data, headers=headers or {})
    req.add_header('Content-Type', 'application/json')
    response = urllib.request.urlopen(req)
    return json.loads(response.read().decode())


print("=" * 50)
print("1. 测试获取公开路线列表")
trips = get('http://localhost:8000/api/trips')
print(f"   找到 {len(trips)} 条公开路线")
for trip in trips:
    print(f"   - {trip['title']} | 点赞: {trip['like_count']} | 作者: {trip['owner']['username']}")

print("\n" + "=" * 50)
print("2. 测试用户登录")
login_result = post('http://localhost:8000/api/auth/login', {
    'username': 'demo',
    'password': '123456'
})
token = login_result['access_token']
print(f"   登录成功: {login_result['user']['username']}")
print(f"   Token 有效长度: {len(token)}")

print("\n" + "=" * 50)
print("3. 测试获取当前用户")
auth_headers = {'Authorization': f'Bearer {token}'}
req = urllib.request.Request('http://localhost:8000/api/auth/me', headers=auth_headers)
me = json.loads(urllib.request.urlopen(req).read().decode())
print(f"   当前用户: {me['username']} <{me['email']}>")

print("\n" + "=" * 50)
print("4. 测试获取路线详情")
trip_detail = get(f'http://localhost:8000/api/trips/{trips[0]["id"]}')
print(f"   路线: {trip_detail['title']}")
print(f"   景点数量: {len(trip_detail['attractions'])}")
print(f"   天数: {len(trip_detail['day_plans'])}")

print("\n" + "=" * 50)
print("5. 测试用户注册")
try:
    register_result = post('http://localhost:8000/api/auth/register', {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': '123456'
    })
    print(f"   注册成功: {register_result['user']['username']}")
except Exception as e:
    print(f"   注册可能已存在: {e}")

print("\n" + "=" * 50)
print("6. 测试获取我的路线")
req = urllib.request.Request('http://localhost:8000/api/user/trips', headers=auth_headers)
my_trips = json.loads(urllib.request.urlopen(req).read().decode())
print(f"   我的路线数量: {len(my_trips)}")

print("\n" + "=" * 50)
print("7. 测试获取收藏列表")
req = urllib.request.Request('http://localhost:8000/api/user/favorites', headers=auth_headers)
favorites = json.loads(urllib.request.urlopen(req).read().decode())
print(f"   收藏数量: {len(favorites)}")

print("\n" + "=" * 50)
print("所有测试通过！")
