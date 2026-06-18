import uuid
from datetime import datetime, timedelta
from flask import request, jsonify
from app import app
from database import db
from models import Emotion, Comment

EMOTION_LABELS = {
    'happy': '开心',
    'calm': '平静',
    'anxious': '焦虑',
    'irritable': '烦躁',
    'tired': '疲惫',
}

EMOTION_SCORES = {
    'happy': 5,
    'calm': 4,
    'tired': 3,
    'anxious': 2,
    'irritable': 1,
}

DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']


def get_anon_id():
    aid = request.headers.get('X-Anonymous-Id')
    if not aid:
        aid = uuid.uuid4().hex[:12]
    return f'user_{aid}'


@app.route('/api/emotion', methods=['POST'])
def submit_emotion():
    data = request.get_json()
    emotion_type = data.get('emotion_type', '')
    note = data.get('note', '')

    if emotion_type not in EMOTION_LABELS:
        return jsonify({'error': 'invalid emotion type'}), 400

    if len(note) > 140:
        return jsonify({'error': 'note too long'}), 400

    record = Emotion(
        emotion_type=emotion_type,
        note=note,
        anonymous_id=get_anon_id(),
        timestamp=datetime.utcnow(),
    )
    db.session.add(record)
    db.session.commit()

    return jsonify(record.to_dict()), 201


@app.route('/api/timeline', methods=['GET'])
def get_timeline():
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    records = Emotion.query.filter(Emotion.timestamp >= week_ago).all()

    day_data = {}
    for i in range(7):
        d = (now - timedelta(days=6 - i)).strftime('%m-%d')
        day_data[d] = {label: 0 for label in EMOTION_LABELS.values()}
        day_data[d]['day'] = DAY_NAMES[(now - timedelta(days=6 - i)).weekday()]

    for r in records:
        d = r.timestamp.strftime('%m-%d')
        if d in day_data:
            label = EMOTION_LABELS.get(r.emotion_type, '平静')
            day_data[d][label] += 1

    result = list(day_data.values())
    return jsonify(result)


@app.route('/api/records', methods=['GET'])
def get_records():
    records = Emotion.query.order_by(Emotion.timestamp.desc()).limit(50).all()
    return jsonify([r.to_dict() for r in records])


@app.route('/api/comment', methods=['POST'])
def post_comment():
    data = request.get_json()
    emotion_id = data.get('emotion_id')
    content = data.get('content', '')
    is_hug = data.get('is_hug', False)

    emotion = Emotion.query.get(emotion_id)
    if not emotion:
        return jsonify({'error': 'emotion not found'}), 404

    if not is_hug and len(content) > 140:
        return jsonify({'error': 'comment too long'}), 400

    comment = Comment(
        emotion_id=emotion_id,
        content=content,
        anonymous_id=get_anon_id(),
        is_hug=is_hug,
        timestamp=datetime.utcnow(),
    )
    db.session.add(comment)
    db.session.commit()

    return jsonify(comment.to_dict()), 201


@app.route('/api/comments/<int:emotion_id>', methods=['GET'])
def get_comments(emotion_id):
    comments = Comment.query.filter_by(emotion_id=emotion_id).order_by(Comment.timestamp).all()
    return jsonify([c.to_dict() for c in comments])


@app.route('/api/report', methods=['GET'])
def get_report():
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    records = Emotion.query.filter(Emotion.timestamp >= week_ago).all()
    if not records:
        return jsonify(None)

    counts = {}
    total_score = 0
    for r in records:
        label = r.emotion_type
        counts[label] = counts.get(label, 0) + 1
        total_score += EMOTION_SCORES.get(label, 3)

    avg_score = total_score / len(records)
    peak = max(counts, key=counts.get)

    total = len(records)
    distribution = {k: v / total for k, v in counts.items()}

    tips_map = {
        'happy': '本周心情不错，继续保持！可以和同事分享你的快乐。',
        'calm': '本周状态平和，适合做一些深度思考的工作。',
        'anxious': '本周焦虑较多，建议尝试深呼吸练习或短暂散步来缓解压力。',
        'irritable': '本周烦躁感较强，建议在工作间隙做5分钟冥想放松。',
        'tired': '本周疲惫感明显，注意劳逸结合，适当休息补充能量。',
    }

    return jsonify({
        'peak_emotion': peak,
        'avg_score': round(avg_score, 2),
        'tips': tips_map.get(peak, '关注自己的情绪变化，保持觉察。'),
        'distribution': distribution,
    })


@app.route('/api/team-heatmap', methods=['GET'])
def get_team_heatmap():
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    records = Emotion.query.filter(Emotion.timestamp >= week_ago).all()

    grid = {}
    for r in records:
        day = r.timestamp.weekday()
        hour = r.timestamp.hour - 9
        if 0 <= hour < 8:
            key = (day, hour)
            if key not in grid:
                grid[key] = {'count': 0, 'scores': [], 'emotions': {}}
            grid[key]['count'] += 1
            grid[key]['scores'].append(EMOTION_SCORES.get(r.emotion_type, 3))
            label = r.emotion_type
            grid[key]['emotions'][label] = grid[key]['emotions'].get(label, 0) + 1

    result = []
    for (day, hour), data in grid.items():
        avg = sum(data['scores']) / len(data['scores'])
        dominant = max(data['emotions'], key=data['emotions'].get)
        label = EMOTION_LABELS.get(dominant, '平静')
        result.append({
            'day': day,
            'hour': hour,
            'count': data['count'],
            'dominant_emotion': label,
            'score': round(avg, 2),
        })

    return jsonify(result)
