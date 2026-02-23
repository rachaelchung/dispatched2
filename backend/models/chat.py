from datetime import datetime
from . import db

class Chat(db.Model):
    __tablename__ = 'chats'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    tag = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    archived = db.Column(db.Boolean, default=False, nullable=False)
    color = db.Column(db.String(7), default='#8b6fd4', nullable=False)

    messages = db.relationship('Message', backref='chat', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'tag': self.tag,
            'created_at': self.created_at.isoformat(),
            'archived': self.archived,
            'color': self.color,
        }