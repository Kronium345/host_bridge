import os
import argparse
from app.db import (
    init_db,
    create_user,
    create_or_link_google_user,
    find_user_by_email,
    open_conn,
    DB_PATH,
    ensure_super_admin,
    grant_admin,
)


def reset_database() -> None:
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    init_db()


def upsert_demo_users() -> None:
    init_db()

    demo_users = [
        {
            "email": "landlord1@example.com",
            "password": "Password123!",
            "first_name": "Lana",
            "last_name": "Lord",
            "phone": "+44 7700 900001",
        },
        {
            "email": "operator1@example.com",
            "password": "Password123!",
            "first_name": "Owen",
            "last_name": "Perry",
            "phone": "+44 7700 900002",
        },
        {
            "email": "hostbridge@gmail.com",
            "password": "Password123!",
            "first_name": "Host",
            "last_name": "Bridge",
            "phone": "+44 7700 900003",
        },
    ]

    for u in demo_users:
        if not find_user_by_email(u["email"]):
            create_user(
                email=u["email"],
                password=u["password"],
                first_name=u.get("first_name"),
                last_name=u.get("last_name"),
                phone=u.get("phone"),
            )

    # Example Google-linked user (no local password)
    create_or_link_google_user(
        google_sub="google-oauth-demo-sub-1",
        email="googleuser@example.com",
        name="Gina OAuth",
        picture_url=None,
    )

    super_admin = ensure_super_admin(
        email=os.environ.get('HB_SUPERADMIN_EMAIL', 'superadmin@hostbridge.local'),
        password=os.environ.get('HB_SUPERADMIN_PASSWORD', 'admin123'),
        first_name='Super',
        last_name='Admin',
    )
    try:
        grant_admin(super_admin['email'], 'hostbridge@gmail.com', role='admin')
    except Exception:
        pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the HostBridge SQLite database with demo data.")
    parser.add_argument("--reset", action="store_true", help="Delete and recreate the database before seeding")
    args = parser.parse_args()

    if args.reset:
        print("[seed] Resetting database ...")
        reset_database()

    print("[seed] Seeding demo users ...")
    upsert_demo_users()
    with open_conn() as conn:
        count = conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"]
    print(f"[seed] Done. Users in DB: {count}")
