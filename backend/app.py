import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_login import LoginManager
from backend.config import Config
from backend.models import db
from backend.models.user import User
from backend.routes.auth import auth_bp
from backend.routes.messages import messages_bp
from backend.routes.tasks import tasks_bp
from backend.routes.chats import chats_bp

def create_app():
    app = Flask(__name__, static_folder='../frontend', static_url_path='')
    app.config.from_object(Config)

    # Init extensions
    db.init_app(app)

    allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:5005').split(',')
    CORS(app, supports_credentials=True, origins=allowed_origins)

    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = None  # API returns 401, frontend handles redirect

    @login_manager.unauthorized_handler
    def unauthorized():
        return {'error': 'Authentication required'}, 401

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(messages_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(chats_bp)

    # Serve frontend
    @app.route('/')
    def index():
        return send_from_directory('../frontend', 'index.html')

    @app.route('/app')
    @app.route('/app.html')
    def app_view():
        return send_from_directory('../frontend', 'app.html')

    # Create tables
    with app.app_context():
        db.create_all()
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    return app


app = create_app()

if __name__ == '__main__':
    app.run(port=5005, debug=os.environ.get('FLASK_ENV') != 'production')
