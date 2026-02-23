import os
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from datetime import datetime, time as time_type
from ..models import db
from ..models.message import Message
from ..models.task import Task, TaskFile
from ..services.gemini_parser import parse_message
from ..services.date_calculator import resolve_date_reference 
from ..services.manual import manualDate

messages_bp = Blueprint('messages', __name__, url_prefix='/api/messages')

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'txt', 'zip'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@messages_bp.route('', methods=['GET'])
@login_required
def get_messages():
    chat_id = request.args.get('chat_id')
    query = Message.query.filter_by(user_id=current_user.id)
    if chat_id:
        query = query.filter_by(chat_id=int(chat_id))
    messages = query.order_by(Message.created_at.asc()).all()
    return jsonify({'messages': [m.to_dict() for m in messages]}), 200

@messages_bp.route('', methods=['POST'])
@login_required
def create_message():
    content = request.form.get('content', '').strip()
    if not content:
        return jsonify({'error': 'Message content required'}), 400

    # Save message
    message = Message(user_id=current_user.id, content=content)
    db.session.add(message)
    db.session.flush()  # get message.id

    # Get chat_id
    chat_id = request.form.get('chat_id')
    chat_tag = 'todo'
    if chat_id:
        from ..models.chat import Chat
        chat = Chat.query.filter_by(id=int(chat_id), user_id=current_user.id).first()
        if chat:
            chat_tag = chat.tag
            message.chat_id = int(chat_id)

    # Get recent tasks for duplicate detection
    recent_tasks = Task.query.filter_by(user_id=current_user.id, status='active')\
        .order_by(Task.created_at.desc()).limit(20).all()
    recent_tasks_dicts = [{'id': t.id, 'title': t.title} for t in recent_tasks]

    # Parse with Gemini
    parsed = parse_message(content, recent_tasks_dicts)

    # Handle edits
    if parsed.get('is_edit_of_previous') and parsed.get('edit_field'):
        last_task = Task.query.filter_by(user_id=current_user.id)\
            .order_by(Task.created_at.desc()).first()
        if last_task:
            field = parsed['edit_field']
            value = parsed.get('edit_value', '')
            if field == 'title':
                last_task.title = value
            elif field == 'date':
                last_task.due_date = resolve_date_reference(value)
            elif field == 'time':
                try:
                    h, m = value.split(':')
                    last_task.due_time = time_type(int(h), int(m))
                except Exception:
                    pass
            elif field == 'tag':
                last_task.tag = value
            elif field == 'description':
                last_task.description = value
            last_task.updated_at = datetime.utcnow()
            db.session.commit()
            return jsonify({
                'message': message.to_dict(),
                'edited_task': last_task.to_dict(),
                'new_tasks': []
            }), 200

    # Check for possible duplicate
    possible_dup_id = None
    if parsed.get('possible_duplicate_title'):
        dup_title = parsed['possible_duplicate_title'].lower()
        for t in recent_tasks:
            if dup_title in t.title.lower() or t.title.lower() in dup_title:
                possible_dup_id = t.id
                break

    if possible_dup_id:
        db.session.commit()
        return jsonify({
            'message': message.to_dict(),
            'duplicate_check_required': True,
            'possible_duplicate_id': possible_dup_id,
            'parsed': parsed,
            'new_tasks': []
        }), 200

    # Create tasks
    new_tasks = []
    for task_data in parsed.get('tasks', []):
        due_date = resolve_date_reference(task_data.get('date_reference'))
        if due_date == None:
            due_date = manualDate(content)
        due_time = None
        if task_data.get('time'):
            try:
                h, m = task_data['time'].split(':')
                due_time = time_type(int(h), int(m))
            except Exception:
                pass

        # Get max sort_order
        max_order = db.session.query(db.func.max(Task.sort_order))\
            .filter_by(user_id=current_user.id).scalar()
        max_order = max_order if max_order is not None else 0

        task = Task(
            user_id=current_user.id,
            message_id=message.id,
            title=task_data.get('title', content[:100]),
            description=task_data.get('description'),
            due_date=due_date,
            due_time=due_time,
            tag=chat_tag,
            sort_order=max_order + 1
        )
        db.session.add(task)
        db.session.flush()

        # Handle file attachments
        files = request.files.getlist('files')
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                upload_dir = os.path.join(
                    current_app.config['UPLOAD_FOLDER'],
                    str(current_user.id),
                    str(task.id)
                )
                os.makedirs(upload_dir, exist_ok=True)
                stored_path = os.path.join(upload_dir, filename)
                file.save(stored_path)
                task_file = TaskFile(
                    task_id=task.id,
                    filename=filename,
                    stored_path=stored_path
                )
                db.session.add(task_file)

        new_tasks.append(task)

    db.session.commit()
    return jsonify({
        'message': message.to_dict(),
        'new_tasks': [t.to_dict() for t in new_tasks],
        'duplicate_check_required': False
    }), 201


@messages_bp.route('/confirm-duplicate', methods=['POST'])
@login_required
def confirm_duplicate():
    """User decided what to do with a duplicate."""
    data = request.get_json()
    action = data.get('action')  # 'add_new' or 'update_existing'
    existing_id = data.get('existing_task_id')
    parsed = data.get('parsed', {})
    message_id = data.get('message_id')

    # Get Chat ID
    chat_id = data.get('chat_id')
    chat_tag = 'todo'
    if chat_id:
        from ..models.chat import Chat
        chat = Chat.query.filter_by(id=int(chat_id), user_id=current_user.id).first()
        if chat:
            chat_tag = chat.tag
        
    if action == 'update_existing':
        task = Task.query.filter_by(id=existing_id, user_id=current_user.id).first_or_404()
        task_data = parsed.get('tasks', [{}])[0]
        if task_data.get('title'):
            task.title = task_data['title']
        due_date = resolve_date_reference(task_data.get('date_reference'))
        if due_date == None:
            due_date = manualDate(content)
        if due_date:
            task.due_date = due_date
        if task_data.get('time'):
            try:
                h, m = task_data['time'].split(':')
                task.due_time = time_type(int(h), int(m))
            except Exception:
                pass
        if task_data.get('tag'):
            task.tag = task_data['tag']
        task.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'updated_task': task.to_dict()}), 200

    # Add as new
    task_data = parsed.get('tasks', [{}])[0]
    due_date = resolve_date_reference(task_data.get('date_reference'))
    due_time = None
    if task_data.get('time'):
        try:
            h, m = task_data['time'].split(':')
            due_time = time_type(int(h), int(m))
        except Exception:
            pass
    max_order = db.session.query(db.func.max(Task.sort_order))\
        .filter_by(user_id=current_user.id).scalar() or 0
    task = Task(
        user_id=current_user.id,
        message_id=message_id,
        title=task_data.get('title', ''),
        description=task_data.get('description'),
        due_date=due_date,
        due_time=due_time,
        tag=chat_tag,
        sort_order=max_order + 1
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'new_task': task.to_dict()}), 201
