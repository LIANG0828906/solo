from datetime import datetime
from database import db


class Emotion(db.Model):
    __tablename__ = 'emotions'

    id = db.Column(db.Integer, primary_key=True)
    emotion_type = db.Column(db.String(20), nullable=False)
    note = db.Column(db.String(140), default='')
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    anonymous_id = db.Column(db.String(32), nullable=False)

    comments = db.relationship('Comment', backref='emotion', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'emotion_type': self.emotion_type,
            'note': self.note,
            'timestamp': self.timestamp.isoformat(),
            'anonymous_id': self.anonymous_id,
            'hugs': sum(1 for c in self.comments if c.is_hug),
            'comments': [c.to_dict() for c in self.comments if not c.is_hug],
        }


class Comment(db.Model):
    __tablename__ = 'comments'

    id = db.Column(db.Integer, primary_key=True)
    emotion_id = db.Column(db.Integer, db.ForeignKey('emotions.id'), nullable=False)
    content = db.Column(db.String(140), default='')
    anonymous_id = db.Column(db.String(32), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_hug = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'emotion_id': self.emotion_id,
            'content': self.content,
            'anonymous_id': self.anonymous_id,
            'timestamp': self.timestamp.isoformat(),
            'is_hug': self.is_hug,
        }
