from flask import Blueprint, request, jsonify, send_file
from flask_login import login_required, current_user
from datetime import datetime, date, time as time_type
from ..models import db
from ..models.task import Task, TaskFile

tasks_bp = Blueprint('tasks', __name__, url_prefix='/api/tasks')


@tasks_bp.route('', methods=['GET'])
@login_required
def get_tasks():
    status = request.args.get('status', 'active')
    query = Task.query.filter_by(user_id=current_user.id)
    if status != 'all':
        query = query.filter_by(status=status)
    tasks = query.order_by(Task.sort_order.asc(), Task.created_at.desc()).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]}), 200


@tasks_bp.route('', methods=['POST'])
@login_required
def create_task():
    data = request.get_json()
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'error': 'Title required'}), 400

    due_date = None
    if data.get('due_date'):
        due_date = date.fromisoformat(data['due_date'])

    due_time = None
    if data.get('due_time'):
        h, m = data['due_time'].split(':')
        due_time = time_type(int(h), int(m))

    max_order = db.session.query(db.func.max(Task.sort_order))\
        .filter_by(user_id=current_user.id).scalar()
    max_order = max_order if max_order is not None else 0

    task = Task(
        user_id=current_user.id,
        title=title,
        description=data.get('description'),
        due_date=due_date,
        due_time=due_time,
        tag=data.get('tag', 'todo'),
        sort_order=max_order + 1
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'task': task.to_dict()}), 201


@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    data = request.get_json()

    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'due_date' in data:
        task.due_date = date.fromisoformat(data['due_date']) if data['due_date'] else None
    if 'due_time' in data:
        if data['due_time']:
            h, m = data['due_time'].split(':')
            task.due_time = time_type(int(h), int(m))
        else:
            task.due_time = None
    if 'tag' in data:
        task.tag = data['tag']
    if 'status' in data:
        task.status = data['status']
    if 'sort_order' in data:
        task.sort_order = data['sort_order']

    task.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'task': task.to_dict()}), 200


@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted'}), 200


@tasks_bp.route('/reorder', methods=['POST'])
@login_required
def reorder_tasks():
    """Accepts list of {id, sort_order} and updates."""
    data = request.get_json()
    for item in data.get('order', []):
        task = Task.query.filter_by(id=item['id'], user_id=current_user.id).first()
        if task:
            task.sort_order = item['sort_order']
    db.session.commit()
    return jsonify({'message': 'Reordered'}), 200


@tasks_bp.route('/<int:task_id>/files/<int:file_id>', methods=['GET'])
@login_required
def download_file(task_id, file_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    f = TaskFile.query.filter_by(id=file_id, task_id=task.id).first_or_404()
    return send_file(f.stored_path, download_name=f.filename)
