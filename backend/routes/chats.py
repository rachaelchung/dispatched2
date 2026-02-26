from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from ..models import db
from ..models.chat import Chat

chats_bp = Blueprint('chats', __name__, url_prefix='/api/chats')

@chats_bp.route('', methods=['GET'])
@login_required
def get_chats():
    chats = Chat.query.filter_by(user_id=current_user.id)\
        .order_by(Chat.created_at.asc()).all()
    return jsonify({'chats': [c.to_dict() for c in chats]}), 200

@chats_bp.route('', methods=['POST'])
@login_required
def create_chat():
    data = request.get_json()
    name = data.get('name', '').strip()
    tag = data.get('tag', 'todo').strip()
    color = data.get('color', '#8b6fd4')
    if not name:
        return jsonify({'error': 'Name required'}), 400
    if Chat.query.filter_by(user_id=current_user.id, name=name).first():
        return jsonify({'error': 'A chat with that name already exists'}), 409
    chat = Chat(user_id=current_user.id, name=name, tag=tag, color=color)
    db.session.add(chat)
    db.session.commit()
    return jsonify({'chat': chat.to_dict()}), 201

@chats_bp.route('/<int:chat_id>', methods=['DELETE'])
@login_required
def delete_chat(chat_id):
    chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first_or_404()
    db.session.delete(chat)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

@chats_bp.route('/<int:chat_id>/archive', methods=['POST'])
@login_required
def archive_chat(chat_id):
    chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first_or_404()
    chat.archived = not chat.archived  # toggle so you can unarchive too
    db.session.commit()
    return jsonify({'chat': chat.to_dict()}), 200

@chats_bp.route('/<int:chat_id>', methods=['PUT'])
@login_required
def update_chat(chat_id):
    chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first_or_404()
    data = request.get_json()
    if 'color' in data:
        chat.color = data['color']
    db.session.commit()
    return jsonify({'chat': chat.to_dict()}), 200