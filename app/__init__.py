from flask import Flask
from flask_cors import CORS
import os
from app.db import init_db

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-me")

app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = False  # Allow JavaScript access for debugging

CORS(app, origins=[
    'https://host-bridge.com',
    'https://www.host-bridge.com', 
    'http://localhost:5000',  
    'http://127.0.0.1:5000'  
], supports_credentials=True, 
    allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Ensure SQLite schema exists on startup
init_db()

from app import routes
