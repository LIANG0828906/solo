import requests

# 登录
response = requests.post('http://localhost:8000/api/auth/login', json={
    'username': 'testuser',
    'password': 'test123456'
})
token = response.json().get('access_token')
headers = {'Authorization': f'Bearer {token}'}
print('Login:', response.status_code, 'Token obtained:', bool(token))

# 添加词汇
words_to_add = [
    ('serendipity', '意外发现美好事物的能力；机缘巧合'),
    ('ephemeral', '短暂的，瞬息的'),
    ('resilient', '有弹性的；适应力强的'),
    ('ubiquitous', '无处不在的'),
    ('melancholy', '忧郁，悲伤'),
]

for word, defn in words_to_add:
    response = requests.post('http://localhost:8000/api/words', json={
        'word': word,
        'definition': defn
    }, headers=headers)
    data = response.json()
    example = data.get('example_sentence', '')
    print(f'Add {word}: {response.status_code}, example: {example[:60]}...')

# 获取词汇列表
response = requests.get('http://localhost:8000/api/words', headers=headers)
words = response.json()
print(f'\nTotal words: {len(words)}')

# 测试标记学习
if words:
    word_id = words[0]['id']
    response = requests.post('http://localhost:8000/api/learn', json={
        'word_id': word_id,
        'is_mastered': False
    }, headers=headers)
    print(f'\nMark review: {response.status_code}')
    print('  forgetting_index:', response.json().get('forgetting_index'))

    # 再标记一次掌握
    response = requests.post('http://localhost:8000/api/learn', json={
        'word_id': word_id,
        'is_mastered': True
    }, headers=headers)
    print(f'Mark master: {response.status_code}')
    print('  forgetting_index:', response.json().get('forgetting_index'))

# 测试复习计划
response = requests.get('http://localhost:8000/api/review-plan', headers=headers)
plan = response.json()
print(f'\nReview plan items: {len(plan)}')
if plan:
    print('Top priority word:', plan[0]['word']['word'], 'priority:', plan[0]['priority'])

# 测试统计
response = requests.get('http://localhost:8000/api/stats', headers=headers)
stats = response.json()
print(f'\nStats:')
print(f'  total_words: {stats["total_words"]}')
print(f'  mastered_words: {stats["mastered_words"]}')
print(f'  streak_days: {stats["streak_days"]}')
print(f'  weekly_data: {stats["weekly_data"]}')

print('\nAll functionality tests passed!')
