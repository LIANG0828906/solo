import json
import sys
sys.path.insert(0, '.')
from app import app


def test_api():
    print('=' * 60)
    print('API 测试开始')
    print('=' * 60)
    
    client = app.test_client()
    
    print('\n1. 测试注册接口...')
    register_data = {
        'email': 'test@example.com',
        'password': '123456',
        'username': '测试用户'
    }
    resp = client.post('/api/auth/register', json=register_data)
    print(f'  状态码: {resp.status_code}')
    data = resp.get_json()
    print(f'  响应: {json.dumps(data, ensure_ascii=False, indent=4)}')
    
    token = None
    if resp.status_code == 201 and 'token' in data:
        token = data['token']
        print(f'  ✓ 注册成功，获取到 Token')
    elif resp.status_code == 400 and '该邮箱已被注册' in str(data):
        print('  ⚠  邮箱已注册，尝试登录...')
        login_data = {'email': 'test@example.com', 'password': '123456'}
        resp = client.post('/api/auth/login', json=login_data)
        print(f'  状态码: {resp.status_code}')
        data = resp.get_json()
        print(f'  响应: {json.dumps(data, ensure_ascii=False, indent=4)}')
        if resp.status_code == 200 and 'token' in data:
            token = data['token']
            print(f'  ✓ 登录成功，获取到 Token')
        else:
            print('  ✗ 登录失败')
            return
    else:
        print('  ✗ 注册失败')
        return
    
    auth_headers = {'Authorization': f'Bearer {token}'}
    
    print('\n2. 测试获取推荐食谱...')
    resp = client.get('/api/recipes/recommendations', headers=auth_headers)
    print(f'  状态码: {resp.status_code}')
    data = resp.get_json()
    print(f'  响应: {json.dumps(data, ensure_ascii=False, indent=4)}')
    if resp.status_code == 200:
        print(f'  ✓ 获取推荐成功')
    
    print('\n3. 测试获取食谱列表...')
    resp = client.get('/api/recipes?page=1&per_page=10')
    print(f'  状态码: {resp.status_code}')
    data = resp.get_json()
    print(f'  响应: {json.dumps(data, ensure_ascii=False, indent=4)}')
    if resp.status_code == 200:
        print(f'  ✓ 获取列表成功，总数: {data.get("total", 0)}')
    
    print('\n4. 测试获取用户信息...')
    user_id = 1
    resp = client.get(f'/api/users/{user_id}')
    print(f'  状态码: {resp.status_code}')
    data = resp.get_json()
    print(f'  响应: {json.dumps(data, ensure_ascii=False, indent=4)}')
    if resp.status_code == 200:
        print(f'  ✓ 获取用户信息成功')
    
    print('\n5. 测试获取用户食谱...')
    resp = client.get(f'/api/users/{user_id}/recipes')
    print(f'  状态码: {resp.status_code}')
    data = resp.get_json()
    print(f'  响应: {json.dumps(data, ensure_ascii=False, indent=4)}')
    if resp.status_code == 200:
        print(f'  ✓ 获取用户食谱成功')
    
    print('\n6. 测试获取用户收藏...')
    resp = client.get(f'/api/users/{user_id}/favorites')
    print(f'  状态码: {resp.status_code}')
    data = resp.get_json()
    print(f'  响应: {json.dumps(data, ensure_ascii=False, indent=4)}')
    if resp.status_code == 200:
        print(f'  ✓ 获取用户收藏成功')
    
    print('\n' + '=' * 60)
    print('API 测试完成')
    print('=' * 60)


if __name__ == '__main__':
    test_api()
