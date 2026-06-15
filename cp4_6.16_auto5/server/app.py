from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

PHOTOS_FILE = os.path.join(DATA_DIR, 'photos.json')
LIKES_FILE = os.path.join(DATA_DIR, 'likes.json')
COMMENTS_FILE = os.path.join(DATA_DIR, 'comments.json')


def load_data(filepath, default):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return default


def save_data(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


photos = load_data(PHOTOS_FILE, [])
likes = load_data(LIKES_FILE, {})
comments = load_data(COMMENTS_FILE, {})


def sync_to_disk():
    save_data(PHOTOS_FILE, photos)
    save_data(LIKES_FILE, likes)
    save_data(COMMENTS_FILE, comments)


@app.route('/api/photos', methods=['GET'])
def get_photos():
    sorted_photos = sorted(photos, key=lambda p: p['createdAt'], reverse=True)
    return jsonify(sorted_photos)


@app.route('/api/photos', methods=['POST'])
def create_photo():
    data = request.json
    photo = {
        'id': int(datetime.now().timestamp() * 1000),
        'imageUrl': data.get('imageUrl', ''),
        'author': data.get('author', '匿名皮友'),
        'userId': data.get('userId', 'anonymous'),
        'createdAt': datetime.now().isoformat(),
        'title': data.get('title', ''),
    }
    photos.append(photo)
    sync_to_disk()
    return jsonify(photo), 201


@app.route('/api/photos/<int:photo_id>/like', methods=['GET'])
def get_like_status(photo_id):
    user_id = request.args.get('userId', '')
    photo_likes = likes.get(str(photo_id), {})
    liked = photo_likes.get(user_id, False)
    like_count = sum(1 for v in photo_likes.values() if v)
    return jsonify({
        'photoId': photo_id,
        'userId': user_id,
        'liked': liked,
        'likeCount': like_count,
    })


@app.route('/api/photos/<int:photo_id>/like', methods=['POST'])
def toggle_like(photo_id):
    data = request.json
    user_id = data.get('userId', '')

    if str(photo_id) not in likes:
        likes[str(photo_id)] = {}

    was_liked = likes[str(photo_id)].get(user_id, False)
    likes[str(photo_id)][user_id] = not was_liked
    like_count = sum(1 for v in likes[str(photo_id)].values() if v)

    sync_to_disk()

    return jsonify({
        'photoId': photo_id,
        'userId': user_id,
        'liked': not was_liked,
        'likeCount': like_count,
    })


@app.route('/api/photos/<int:photo_id>/likes', methods=['GET'])
def get_like_count(photo_id):
    photo_likes = likes.get(str(photo_id), {})
    count = sum(1 for v in photo_likes.values() if v)
    return jsonify({'count': count})


@app.route('/api/photos/<int:photo_id>/comments', methods=['GET'])
def get_comments(photo_id):
    photo_comments = comments.get(str(photo_id), [])
    sorted_comments = sorted(
        photo_comments,
        key=lambda c: c['createdAt'],
        reverse=True,
    )
    return jsonify(sorted_comments)


@app.route('/api/photos/<int:photo_id>/comments', methods=['POST'])
def add_comment(photo_id):
    data = request.json
    comment = {
        'id': int(datetime.now().timestamp() * 1000),
        'photoId': photo_id,
        'userId': data.get('userId', 'anonymous'),
        'username': data.get('username', '匿名皮友'),
        'content': data.get('content', ''),
        'createdAt': datetime.now().isoformat(),
    }

    if str(photo_id) not in comments:
        comments[str(photo_id)] = []

    comments[str(photo_id)].append(comment)
    sync_to_disk()

    return jsonify(comment), 201


@app.route('/api/photos/<int:photo_id>/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(photo_id, comment_id):
    if str(photo_id) in comments:
        comments[str(photo_id)] = [
            c for c in comments[str(photo_id)] if c['id'] != comment_id
        ]
        sync_to_disk()
    return jsonify({'success': True})


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})


if __name__ == '__main__':
    print('匠心工坊 Flask 后端启动中...')
    print('API 服务地址: http://localhost:5000')
    app.run(host='0.0.0.0', port=5000, debug=True)
