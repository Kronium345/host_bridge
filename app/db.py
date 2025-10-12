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
    """Create required tables if they do not exist and run lightweight migrations."""
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
                -- RBAC fields (added via migrations if missing)
                role TEXT DEFAULT 'user', -- one of: user, admin, superadmin
                approval_status TEXT DEFAULT 'approved', -- pending/approved/rejected
                email_verified INTEGER DEFAULT 0, -- 0/1
                approved_by INTEGER, -- user id of approver (nullable)
                approved_at TEXT, -- timestamp
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                -- Verification status
                verification_status TEXT DEFAULT 'pending' -- pending/verified/rejected
            )
            """
        )

        existing_cols = {r[1] for r in conn.execute('PRAGMA table_info(users)').fetchall()}
        if 'google_sub' not in existing_cols:
            conn.execute('ALTER TABLE users ADD COLUMN google_sub TEXT')
            conn.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub)')
        else:
            conn.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub)')
        if 'picture_url' not in existing_cols:
            conn.execute('ALTER TABLE users ADD COLUMN picture_url TEXT')

        if 'role' not in existing_cols:
            conn.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'")
        if 'approval_status' not in existing_cols:
            conn.execute("ALTER TABLE users ADD COLUMN approval_status TEXT DEFAULT 'approved'")
        if 'email_verified' not in existing_cols:
            conn.execute("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0")
        if 'approved_by' not in existing_cols:
            conn.execute("ALTER TABLE users ADD COLUMN approved_by INTEGER")
        if 'approved_at' not in existing_cols:
            conn.execute("ALTER TABLE users ADD COLUMN approved_at TEXT")
        if 'verification_status' not in existing_cols:
            conn.execute("ALTER TABLE users ADD COLUMN verification_status TEXT DEFAULT 'pending'")

        # Create verification_documents table
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS verification_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                document_type TEXT NOT NULL, -- 'identity', 'address', 'role'
                document_subtype TEXT, -- 'passport', 'driving_license', etc.
                file_path TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_size INTEGER,
                status TEXT DEFAULT 'pending', -- pending/approved/rejected
                rejection_reason TEXT,
                uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TEXT,
                reviewed_by INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )

        # Create verification_status table for tracking overall progress
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_verification_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                identity_verified INTEGER DEFAULT 0,
                address_verified INTEGER DEFAULT 0,
                role_verified INTEGER DEFAULT 0,
                overall_status TEXT DEFAULT 'pending', -- pending/in_progress/completed/rejected
                last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )

        # Create ratings table
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS ratings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                user_email TEXT,
                rating REAL NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                target_type TEXT DEFAULT 'general', -- 'operator', 'property', 'service', etc.
                target_id TEXT DEFAULT 'general', -- ID of the item being rated
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
                last_name: Optional[str] = None, phone: Optional[str] = None,
                role: str = 'user', approval_status: str = 'approved',
                email_verified: int = 0) -> int:
    password_hash = generate_password_hash(password)
    with open_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO users (email, password_hash, first_name, last_name, phone, role, approval_status, email_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (email, password_hash, first_name, last_name, phone, role, approval_status, email_verified),
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


# -----------------------
# Admin/RBAC helpers
# -----------------------

ALLOWED_ROLES = {'user', 'admin', 'superadmin'}


def set_user_role(target_user_id: int, new_role: str, approved_by: Optional[int] = None) -> None:
    if new_role not in ALLOWED_ROLES:
        raise ValueError(f"Invalid role: {new_role}")
    with open_conn() as conn:
        conn.execute(
            "UPDATE users SET role = ?, approved_by = COALESCE(?, approved_by), approved_at = CURRENT_TIMESTAMP WHERE id = ?",
            (new_role, approved_by, target_user_id),
        )


def ensure_super_admin(email: str = 'superadmin@hostbridge.local', password: str = 'admin123',
                       first_name: str = 'Super', last_name: str = 'Admin') -> Dict:
    """Idempotently create a super admin if not present. Returns the user row as dict."""
    with open_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if row:
            return dict(row)
    user_id = create_user(email=email, password=password, first_name=first_name, last_name=last_name,
                          role='superadmin', approval_status='approved', email_verified=1)
    return find_user_by_email(email)


def grant_admin(granter_email: str, target_email: str, role: str = 'admin') -> None:
    """Grant admin or user role to a target email. Only a superadmin can grant admin roles."""
    granter = find_user_by_email(granter_email)
    if not granter or granter.get('role') != 'superadmin':
        raise PermissionError('Only superadmin can grant roles')
    target = find_user_by_email(target_email)
    if not target:
        raise ValueError('Target user not found')
    set_user_role(target['id'], role, approved_by=granter['id'])


# -----------------------
# Verification helpers
# -----------------------

def save_verification_document(user_id: int, document_type: str, document_subtype: Optional[str],
                               file_path: str, file_name: str, file_size: int) -> int:
    """Save a verification document record to the database."""
    with open_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO verification_documents 
            (user_id, document_type, document_subtype, file_path, file_name, file_size, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
            """,
            (user_id, document_type, document_subtype, file_path, file_name, file_size)
        )
        # Initialize or update verification status
        conn.execute(
            """
            INSERT INTO user_verification_status (user_id, overall_status)
            VALUES (?, 'in_progress')
            ON CONFLICT(user_id) DO UPDATE SET 
                last_updated = CURRENT_TIMESTAMP,
                overall_status = CASE 
                    WHEN overall_status = 'pending' THEN 'in_progress'
                    ELSE overall_status
                END
            """,
            (user_id,)
        )
        return cur.lastrowid


def get_user_verification_status(user_id: int) -> Optional[Dict]:
    """Get the verification status for a user."""
    with open_conn() as conn:
        row = conn.execute(
            "SELECT * FROM user_verification_status WHERE user_id = ?",
            (user_id,)
        ).fetchone()
        return dict(row) if row else None


def get_user_verification_documents(user_id: int, document_type: Optional[str] = None) -> list:
    """Get all verification documents for a user, optionally filtered by type."""
    with open_conn() as conn:
        if document_type:
            rows = conn.execute(
                "SELECT * FROM verification_documents WHERE user_id = ? AND document_type = ? ORDER BY uploaded_at DESC",
                (user_id, document_type)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM verification_documents WHERE user_id = ? ORDER BY uploaded_at DESC",
                (user_id,)
            ).fetchall()
        return [dict(row) for row in rows]


def check_verification_completion(user_id: int) -> Dict:
    """Check if all verification steps are complete."""
    docs = get_user_verification_documents(user_id)
    
    has_identity = any(d['document_type'] == 'identity' and d['status'] == 'approved' for d in docs)
    has_address = any(d['document_type'] == 'address' and d['status'] == 'approved' for d in docs)
    has_role = any(d['document_type'] == 'role' and d['status'] == 'approved' for d in docs)
    
    all_complete = has_identity and has_address and has_role
    
    with open_conn() as conn:
        if all_complete:
            conn.execute(
                """
                UPDATE user_verification_status 
                SET identity_verified = 1, address_verified = 1, role_verified = 1,
                    overall_status = 'completed', last_updated = CURRENT_TIMESTAMP
                WHERE user_id = ?
                """,
                (user_id,)
            )
            conn.execute(
                "UPDATE users SET verification_status = 'verified' WHERE id = ?",
                (user_id,)
            )
        else:
            conn.execute(
                """
                UPDATE user_verification_status 
                SET identity_verified = ?, address_verified = ?, role_verified = ?,
                    last_updated = CURRENT_TIMESTAMP
                WHERE user_id = ?
                """,
                (int(has_identity), int(has_address), int(has_role), user_id)
            )
    
    return {
        'identity_verified': has_identity,
        'address_verified': has_address,
        'role_verified': has_role,
        'all_complete': all_complete
    }


# -----------------------
# Rating system helpers
# -----------------------

def save_rating(rating_data: dict) -> int:
    """Save a rating to the database."""
    with open_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO ratings 
            (user_id, user_email, rating, comment, target_type, target_id, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                rating_data.get('user_id'),
                rating_data.get('user_email'),
                rating_data['rating'],
                rating_data.get('comment', ''),
                rating_data.get('target_type', 'general'),
                rating_data.get('target_id', 'general'),
                rating_data.get('timestamp')
            )
        )
        return cur.lastrowid


def get_ratings_for_target(target_type: str, target_id: str) -> list:
    """Get all ratings for a specific target."""
    with open_conn() as conn:
        rows = conn.execute(
            """
            SELECT rating, comment, user_email, timestamp 
            FROM ratings 
            WHERE target_type = ? AND target_id = ?
            ORDER BY timestamp DESC
            """,
            (target_type, target_id)
        ).fetchall()
        return [dict(row) for row in rows]


def calculate_average_rating(ratings: list) -> float:
    """Calculate average rating from a list of rating records."""
    if not ratings:
        return 0.0
    
    total = sum(rating['rating'] for rating in ratings)
    return round(total / len(ratings), 1)
