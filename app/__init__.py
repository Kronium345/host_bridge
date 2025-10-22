from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager, UserMixin
import os
from app.db import init_db

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-me")

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin):
    def __init__(self, user_id, email, first_name=None, last_name=None, role='user'):
        self.id = user_id
        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.role = role

@login_manager.user_loader
def load_user(user_id):
    from app.db import get_user_by_id
    user_data = get_user_by_id(int(user_id))
    if user_data:
        return User(
            user_id=user_data['id'],
            email=user_data['email'],
            first_name=user_data.get('first_name'),
            last_name=user_data.get('last_name'),
            role=user_data.get('role', 'user')
        )
    return None

app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = False  # Allow JavaScript access for debugging

CORS(app, 
    origins=[
        'https://host-bridge.com',
        'https://www.host-bridge.com',
        'http://host-bridge.com',
        'http://www.host-bridge.com',
        'http://localhost:5000',
        'http://127.0.0.1:5000'
    ],
    supports_credentials=True,
    allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    expose_headers=['Content-Type', 'Authorization'],
    max_age=3600)

# Ensure SQLite schema exists on startup
init_db()

@app.after_request
def after_request(response):
    if 'Set-Cookie' in response.headers:
        cookies = response.headers.getlist('Set-Cookie')
        response.headers.remove('Set-Cookie')
        for cookie in cookies:
            if 'SameSite' not in cookie:
                cookie += '; SameSite=None; Secure'
            response.headers.add('Set-Cookie', cookie)
    return response

from app import routes
