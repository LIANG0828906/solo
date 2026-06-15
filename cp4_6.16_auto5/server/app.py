from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import hashlib
import secrets
from datetime import datetime
import json

app = Flask(__name__)
CORS(app, supports_credentials=True)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

USERS_FILE = os.path.join(DATA_DIR, 'users.json')
PHOTOS_FILE = os.path.join(DATA_DIR, 'photos.json')
LIKES_FILE = os.path.join(DATA_DIR, 'likes.json')
COMMENTS_FILE = os.path.join(DATA_DIR, 'comments.json')
TOKENS_FILE = os.path.join(DATA_DIR, 'tokens.json')


def load_data(filepath, default):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return default


def save_data(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def generate_token() -> str:
    return secrets.token_hex(32)


users = load_data(USERS_FILE, {})
photos = load_data(PHOTOS_FILE, [])
likes = load_data(LIKES_FILE, {})
comments = load_data(COMMENTS_FILE, {})
tokens = load_data(TOKENS_FILE, {})


def sync_to_disk():
    save_data(USERS_FILE, users)
    save_data(PHOTOS_FILE, photos)
    save_data(LIKES_FILE, likes)
    save_data(COMMENTS_FILE, comments)
    save_data(TOKENS_FILE, tokens)


def get_user_from_token(request_obj):
    auth_header = request_obj.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
        username = tokens.get(token)
        if username and username in users:
            return username
    return None


TUTORIAL_STEPS = [
    {
        "id": 1,
        "stepNumber": 1,
        "title": "准备材料与工具",
        "description": "开始制作之前，请准备好以下材料：\n\n• 植鞣革皮料 30cm × 20cm（约1.5mm厚度）\n• 蜡线（亚麻线）2米\n• 菱斩（4mm间距）\n• 裁皮刀、剪刀\n• 锤子、木砧板\n• 边线器、水银笔\n• 砂纸（400#、800#）\n• 床面处理剂或CMC\n• 封边液\n\n建议在通风良好、光线充足的工作台进行。",
        "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=leathercraft%20tools%20arranged%20on%20wooden%20workbench%2C%20leather%20material%2C%20stitching%20tools%2C%20warm%20lighting%2C%20craftsmanship&image_size=landscape_4_3",
        "estimatedDuration": 300
    },
    {
        "id": 2,
        "stepNumber": 2,
        "title": "裁剪皮料",
        "description": "1. 将图纸模板放在皮料背面，用水银笔轻轻勾勒出钱包的轮廓。\n\n2. 用裁皮刀沿着线条切割皮料，保持刀刃垂直，用力均匀。\n\n3. 切割时建议使用钢尺辅助，确保边缘平直。\n\n4. 裁好后，用砂纸轻轻打磨切口，去除毛边。\n\n⚠️ 注意：裁皮刀非常锋利，小心手指！",
        "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hands%20cutting%20vegetable%20tanned%20leather%20with%20sharp%20knife%20and%20steel%20ruler%20on%20cutting%20mat%2C%20craftsmanship%2C%20close%20up%20view&image_size=landscape_4_3",
        "estimatedDuration": 600
    },
    {
        "id": 3,
        "stepNumber": 3,
        "title": "床面处理与封边（内侧）",
        "description": "1. 在皮料背面（肉面）均匀涂抹一层床面处理剂。\n\n2. 用打磨棒或光滑的牛角片快速摩擦，直到表面光滑有光泽。\n\n3. 待完全干燥后，同样处理皮料的边缘截面。\n\n4. 先用400#砂纸打磨边缘，再用800#砂纸细磨。\n\n5. 反复涂抹封边液并打磨，直到边缘光滑温润。\n\n💡 技巧：封边需要耐心，反复3-5次效果最佳。",
        "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=leather%20edge%20burnishing%20process%2C%20sanding%20and%20polishing%20leather%20edges%2C%20craftsman%20hands%2C%20workshop%20setting&image_size=landscape_4_3",
        "estimatedDuration": 900
    },
    {
        "id": 4,
        "stepNumber": 4,
        "title": "打斩孔（缝线准备）",
        "description": "1. 用水银笔在需要缝合的位置画出缝线参考线。\n\n2. 使用边线器在皮料边缘压出均匀的边线。\n\n3. 将菱斩对准参考线，保持垂直，用锤子敲击。\n\n4. 力度要适中：太浅缝起来困难，太深会损坏皮面。\n\n5. 转角处要特别注意，保持孔间距一致。\n\n💡 建议：先在废皮上练习几次打斩的力度。",
        "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=craftsman%20punching%20stitching%20holes%20in%20leather%20with%20pricking%20iron%20chisel%20and%20mallet%20on%20wooden%20block&image_size=landscape_4_3",
        "estimatedDuration": 900
    },
    {
        "id": 5,
        "stepNumber": 5,
        "title": "手工马鞍针法缝合",
        "description": "1. 截取约4倍缝合长度的蜡线，两端穿针。\n\n2. 从第一个孔开始，两根针分别从两面穿过。\n\n3. 左右交替穿线，每次拉紧时保持力度均匀。\n\n4. 缝线要平直整齐，不要过松或过紧。\n\n5. 收尾时回缝2-3针，剪断线头用打火机烧结固定。\n\n💡 经典马鞍针法：即使一处断线，整条线也不会散开。",
        "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hand%20stitching%20leather%20with%20saddle%20stitch%20technique%2C%20two%20needles%20waxed%20thread%2C%20leather%20craft%2C%20close%20up&image_size=landscape_4_3",
        "estimatedDuration": 1800
    },
    {
        "id": 6,
        "stepNumber": 6,
        "title": "外侧封边与成品打磨",
        "description": "1. 将钱包外侧边缘用砂纸打磨平整。\n\n2. 涂抹封边液，用打磨棒快速摩擦发热。\n\n3. 重复封边3次以上，直到边缘圆润有光泽。\n\n4. 用干净的软布擦拭整个钱包，抛光皮面。\n\n5. 检查所有缝线，确保没有松动。\n\n6. 装入卡片和现金，测试卡位和钞位。\n\n🎉 恭喜！你的手工钱包完成了！",
        "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=finished%20handmade%20leather%20wallet%2C%20beautifully%20crafted%2C%20polished%20edges%2C%20warm%20tan%20color%2C%20elegant%20display&image_size=landscape_4_3",
        "estimatedDuration": 600
    }
]


# ============================================================
# 用户注册登录接口
# ============================================================

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or len(username) < 2:
        return jsonify({'error': '用户名至少需要2个字符'}), 400
    if not password or len(password) < 4:
        return jsonify({'error': '密码至少需要4个字符'}), 400
    if username in users:
        return jsonify({'error': '该用户名已被注册'}), 409

    users[username] = {
        'password': hash_password(password),
        'createdAt': datetime.now().isoformat(),
    }
    sync_to_disk()

    return jsonify({
        'message': '注册成功',
        'user': {
            'username': username,
            'createdAt': users[username]['createdAt'],
        }
    }), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': '请输入用户名和密码'}), 400

    if username not in users:
        return jsonify({'error': '用户不存在，请先注册'}), 404

    if users[username]['password'] != hash_password(password):
        return jsonify({'error': '密码错误'}), 401

    token = generate_token()
    tokens[token] = username
    sync_to_disk()

    return jsonify({
        'message': '登录成功',
        'token': token,
        'user': {
            'username': username,
            'createdAt': users[username]['createdAt'],
        }
    }), 200


@app.route('/api/user/info', methods=['GET'])
def get_user_info():
    username = get_user_from_token(request)
    if not username:
        return jsonify({'error': '未登录'}), 401

    return jsonify({
        'username': username,
        'createdAt': users[username]['createdAt'],
    })


@app.route('/api/logout', methods=['POST'])
def logout():
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
        if token in tokens:
            del tokens[token]
            sync_to_disk()
    return jsonify({'message': '退出成功'})


# ============================================================
# 教程数据获取接口
# ============================================================

@app.route('/api/tutorial/steps', methods=['GET'])
def get_tutorial_steps():
    return jsonify({
        'totalSteps': len(TUTORIAL_STEPS),
        'totalEstimatedTime': sum(s['estimatedDuration'] for s in TUTORIAL_STEPS),
        'steps': TUTORIAL_STEPS,
    })


@app.route('/api/tutorial/steps/<int:step_id>', methods=['GET'])
def get_tutorial_step(step_id):
    step = next((s for s in TUTORIAL_STEPS if s['id'] == step_id), None)
    if not step:
        return jsonify({'error': '步骤不存在'}), 404
    return jsonify(step)


# ============================================================
# 点赞 API
# ============================================================

@app.route('/api/like', methods=['POST'])
def handle_like():
    username = get_user_from_token(request)
    data = request.json or {}
    photo_id = data.get('photoId')
    user_id = username or data.get('userId', 'anonymous')

    if not photo_id:
        return jsonify({'error': '缺少photoId参数'}), 400

    photo_id_str = str(photo_id)
    if photo_id_str not in likes:
        likes[photo_id_str] = {}

    was_liked = likes[photo_id_str].get(user_id, False)
    likes[photo_id_str][user_id] = not was_liked
    like_count = sum(1 for v in likes[photo_id_str].values() if v)

    sync_to_disk()

    return jsonify({
        'photoId': photo_id,
        'userId': user_id,
        'liked': not was_liked,
        'likeCount': like_count,
        'message': '点赞成功' if not was_liked else '取消点赞',
    })


@app.route('/api/likes', methods=['GET'])
def get_likes():
    photo_id = request.args.get('photoId')
    user_id = request.args.get('userId', '')

    if not photo_id:
        return jsonify({'error': '缺少photoId参数'}), 400

    photo_id_str = str(photo_id)
    photo_likes = likes.get(photo_id_str, {})
    liked = photo_likes.get(user_id, False)
    like_count = sum(1 for v in photo_likes.values() if v)

    return jsonify({
        'photoId': int(photo_id),
        'userId': user_id,
        'liked': liked,
        'likeCount': like_count,
    })


# ============================================================
# 评论 API
# ============================================================

@app.route('/api/comment', methods=['POST'])
def submit_comment():
    username = get_user_from_token(request)
    data = request.json or {}
    photo_id = data.get('photoId')
    content = data.get('content', '').strip()
    user_id = username or data.get('userId', 'anonymous')
    display_name = username or data.get('username', '匿名皮友')

    if not photo_id:
        return jsonify({'error': '缺少photoId参数'}), 400
    if not content:
        return jsonify({'error': '评论内容不能为空'}), 400
    if len(content) > 500:
        return jsonify({'error': '评论内容不能超过500字'}), 400

    comment = {
        'id': int(datetime.now().timestamp() * 1000),
        'photoId': photo_id,
        'userId': user_id,
        'username': display_name,
        'content': content,
        'createdAt': datetime.now().isoformat(),
    }

    photo_id_str = str(photo_id)
    if photo_id_str not in comments:
        comments[photo_id_str] = []

    comments[photo_id_str].append(comment)
    sync_to_disk()

    return jsonify({
        'message': '评论成功',
        'comment': comment,
    }), 201


@app.route('/api/comments', methods=['GET'])
def get_comments_list():
    photo_id = request.args.get('photoId')
    if not photo_id:
        return jsonify({'error': '缺少photoId参数'}), 400

    photo_id_str = str(photo_id)
    photo_comments = comments.get(photo_id_str, [])

    sorted_comments = sorted(
        photo_comments,
        key=lambda c: c['createdAt'],
        reverse=True,
    )

    return jsonify({
        'photoId': int(photo_id),
        'total': len(sorted_comments),
        'comments': sorted_comments,
    })


@app.route('/api/comments/<int:comment_id>', methods=['DELETE'])
def delete_single_comment(comment_id):
    username = get_user_from_token(request)
    if not username:
        return jsonify({'error': '需要登录才能删除评论'}), 401

    for photo_id_str, photo_comments in comments.items():
        for idx, comment in enumerate(photo_comments):
            if comment['id'] == comment_id:
                if comment['userId'] != username:
                    return jsonify({'error': '只能删除自己的评论'}), 403
                deleted = photo_comments.pop(idx)
                sync_to_disk()
                return jsonify({
                    'message': '删除成功',
                    'commentId': deleted['id'],
                })

    return jsonify({'error': '评论不存在'}), 404


# ============================================================
# 作品照片 API
# ============================================================

@app.route('/api/photos', methods=['GET'])
def get_photos_list():
    sorted_photos = sorted(photos, key=lambda p: p['createdAt'], reverse=True)
    return jsonify({
        'total': len(sorted_photos),
        'photos': sorted_photos,
    })


@app.route('/api/photos', methods=['POST'])
def upload_photo():
    username = get_user_from_token(request)
    data = request.json or {}

    photo = {
        'id': int(datetime.now().timestamp() * 1000),
        'imageUrl': data.get('imageUrl', ''),
        'title': data.get('title', '我的手作'),
        'description': data.get('description', ''),
        'author': username or data.get('author', '匿名皮友'),
        'userId': username or data.get('userId', 'anonymous'),
        'createdAt': datetime.now().isoformat(),
    }
    photos.append(photo)
    sync_to_disk()

    return jsonify({
        'message': '发布成功',
        'photo': photo,
    }), 201


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'stats': {
            'users': len(users),
            'photos': len(photos),
            'comments': sum(len(c) for c in comments.values()),
        }
    })


if __name__ == '__main__':
    print('=' * 50)
    print('   匠心工坊 Flask 后端服务启动中...')
    print('=' * 50)
    print(f'  服务地址: http://localhost:5000')
    print(f'  健康检查: http://localhost:5000/api/health')
    print('')
    print('  可用接口:')
    print('    POST /api/register         - 用户注册')
    print('    POST /api/login            - 用户登录')
    print('    GET  /api/tutorial/steps   - 获取教程步骤')
    print('    POST /api/like             - 点赞/取消点赞')
    print('    POST /api/comment          - 发表评论')
    print('    GET  /api/comments         - 获取评论列表')
    print('=' * 50)
    app.run(host='0.0.0.0', port=5000, debug=True)
