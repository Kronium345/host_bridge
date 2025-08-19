import os
import sqlite3
from contextlib import contextmanager
from typing import Optional, Dict
from werkzeug.security import generate_password_hash, check_password_hash

# Resolve DB path relative to the project root
APP_DIR = os.path.dirname(__file__)
PROJECT_ROOT = os.path.dirname(APP_DIR)
DATABASE_DIR = os.path.join(PROJECT_ROOT, 'database')
DB_PATH = os.path.join(DATABASE_DIR, 'hostbridge.db')

os.makedirs(DATABASE_DIR, exist_ok=True)

@contextmanager
def open_conn(db_path: str = DB_PATH):
    """Open a SQLite connection with dict rows and foreign keys enforced."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Create required tables if they do not exist."""
    with open_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                phone TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


# -----------------------
# User helpers (Auth)
# -----------------------

def find_user_by_email(email: str) -> Optional[Dict]:
    with open_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row) if row else None


def create_user(email: str, password: str, first_name: Optional[str] = None,
                last_name: Optional[str] = None, phone: Optional[str] = None) -> int:
    password_hash = generate_password_hash(password)
    with open_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO users (email, password_hash, first_name, last_name, phone)
            VALUES (?, ?, ?, ?, ?)
            """,
            (email, password_hash, first_name, last_name, phone),
        )
        return cur.lastrowid


def verify_credentials(email: str, password: str) -> Optional[Dict]:
    user = find_user_by_email(email)
    if not user:
        return None
    if check_password_hash(user['password_hash'], password):
        return user
    return None
