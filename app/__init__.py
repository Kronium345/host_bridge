from flask import Flask
import os
from app.db import init_db

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-me")

# Ensure SQLite schema exists on startup
init_db()

from app import routes
