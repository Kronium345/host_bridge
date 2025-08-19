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
                password_hash TEXT,
                first_name TEXT,
                last_name TEXT,
                phone TEXT,
                google_sub TEXT UNIQUE,
                picture_url TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        existing_cols = {r[1] for r in conn.execute('PRAGMA table_info(users)').fetchall()}
        if 'google_sub' not in existing_cols:
            conn.execute('ALTER TABLE users ADD COLUMN google_sub TEXT UNIQUE')
        if 'picture_url' not in existing_cols:
            conn.execute('ALTER TABLE users ADD COLUMN picture_url TEXT')


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


def create_or_link_google_user(google_sub: str, email: Optional[str], name: Optional[str] = None,
                               picture_url: Optional[str] = None) -> Dict:
    """Create (or link) a user account for a Google identity.

    Strategy:
    - If a user with this google_sub exists → return it.
    - Else if a user exists with this email → attach google_sub and picture_url → return it.
    - Else create a new user row with google_sub, email, names parsed from display name, password_hash NULL.
    """
    first_name = None
    last_name = None
    if name:
        parts = name.strip().split(' ')
        if parts:
            first_name = parts[0]
            if len(parts) > 1:
                last_name = ' '.join(parts[1:])

    with open_conn() as conn:
        # Lookup by google_sub first
        row = conn.execute('SELECT * FROM users WHERE google_sub = ?', (google_sub,)).fetchone()
        if row:
            return dict(row)

        # Link by email if present
        if email:
            row = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
            if row:
                conn.execute(
                    'UPDATE users SET google_sub = ?, picture_url = COALESCE(?, picture_url) WHERE id = ?',
                    (google_sub, picture_url, row['id'])
                )
                updated = conn.execute('SELECT * FROM users WHERE id = ?', (row['id'],)).fetchone()
                return dict(updated)

        # Create new user (password_hash intentionally NULL for Google-only account)
        cur = conn.execute(
            'INSERT INTO users (email, password_hash, first_name, last_name, google_sub, picture_url) VALUES (?, NULL, ?, ?, ?, ?)',
            (email, first_name, last_name, google_sub, picture_url)
        )
        new_row = conn.execute('SELECT * FROM users WHERE id = ?', (cur.lastrowid,)).fetchone()
        return dict(new_row)
