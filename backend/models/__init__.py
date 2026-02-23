from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .message import Message
from .task import Task, TaskFile
from .chat import Chat
