# HostBridge (Flask + SQLite)

HostBridge is a web app for connecting landlords and short‑term rental (STR) operators, providing compliance resources, listings, and onboarding tools. It includes:

- Static marketing pages and templates
- Account registration/login with hashed passwords (SQLite)
- Optional Google Sign‑In (server‑side OAuth 2.0 / OIDC)
- Clean seagreen/white theme with a responsive navbar


## Project structure

```
Host_bridge/Host_bridge/
  app/
    __init__.py          # Flask app factory and DB init
    db.py                # SQLite helpers and user auth utilities
    routes.py            # All routes (pages + auth + Google OAuth)
    static/
      css/styles.css     # Global styles (includes auth + privacy styles)
      images/            # Static images (logos, icons)
    templates/           # Jinja templates extending base.html
  database/
    hostbridge.db        # SQLite DB file (auto-created on first run)
  run.py                 # Entry point (python run.py)
```


## Requirements

- Python 3.10+
- pip / venv

Install dependencies (minimum for local dev):

```bash
pip install flask google-auth google-auth-oauthlib requests
```


## Quick start (Windows PowerShell)

```powershell
cd C:\Users\danie\Downloads\Host_bridge\Host_bridge
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install flask google-auth google-auth-oauthlib requests

# Required for sessions
$env:FLASK_SECRET_KEY = (python -c "import secrets;print(secrets.token_hex(32))")


python run.py
```

Open `http://127.0.0.1:5000/` in your browser.


## Database (SQLite)

- The file `database/hostbridge.db` is created automatically.
- `app/db.py` provides:
  - `init_db()` — creates the `users` table if missing
  - `create_user(email, password, ...)` — stores a hashed password
  - `verify_credentials(email, password)` — checks login
  - `create_or_link_google_user(google_sub, email, name, picture_url)` — links or creates a Google user

You can inspect the DB using the SQLite CLI or a GUI (e.g., DB Browser for SQLite).


## Auth flows

### Password auth (already enabled)
- POST `/register` — creates a user, logs the user in
- POST `/login` — verifies credentials, starts a session
- GET `/logout` — clears the session

### Google Sign‑In (server‑side OAuth 2.0 / OIDC)
- Uses `google-auth` to verify ID tokens and `google-auth-oauthlib` to run the OAuth flow.
- Routes:
  - GET `/login/google` — starts the OAuth flow
  - GET `/auth/google/callback` — handles callback, verifies ID token, logs the user in

Install and set environment variables:

```bash
pip install google-auth google-auth-oauthlib requests
# Required
export GOOGLE_OAUTH_CLIENT_ID="...apps.googleusercontent.com"
export GOOGLE_OAUTH_CLIENT_SECRET="..."
# Dev only (http):
export OAUTHLIB_INSECURE_TRANSPORT=1
```

Configure redirect URIs in Google Cloud (OAuth 2.0 client → Web application):

- Local development:
  - `http://127.0.0.1:5000/auth/google/callback`
- Production:
  - `https://host-bridge.com/auth/google/callback`

> Make sure these URIs exactly match what Google shows in the client configuration.

References:
- google-auth docs: https://google-auth.readthedocs.io/en/latest/
- google-auth library (source): https://github.com/googleapis/google-auth-library-python


## Environment variables

- `FLASK_SECRET_KEY` — required to sign sessions (use a long random hex)
- `GOOGLE_OAUTH_CLIENT_ID` — OAuth client ID (Google Cloud)
- `GOOGLE_OAUTH_CLIENT_SECRET` — OAuth client secret (Google Cloud)
- `OAUTHLIB_INSECURE_TRANSPORT` — set to `1` only in development for `http://127.0.0.1:5000`


## Styling

Styles live in `app/static/css/styles.css` and include sections for:
- Navbar, hero, sections
- Auth pages (login/register/forgot password)
- Privacy policy (`/privacy`)


## Deployment notes

- Set environment variables in your host (never commit secrets):
  - `FLASK_SECRET_KEY` (required)
  - `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` (if using Google Sign‑In)
- Ensure your production URL matches the OAuth redirect URI (`https://host-bridge.com/auth/google/callback`).
- Run with a production server (e.g., gunicorn behind nginx) and HTTPS enabled.

## Seeding Database
- To have test data for logging in/signing up, you can seed the database. To do this WITHOUT resetting database:
  - .\.venv\Scripts\Activate.ps1
      python seed.py

- To reset database:
  - python seed.py --reset


## Troubleshooting

- `redirect_uri_mismatch`: The callback URL in Google Cloud does not match your app’s redirect URI.
- `invalid_grant`: Code already used/expired; retry the flow.
- `invalid_audience`: Verifying ID token with wrong client ID.
- No refresh token: Google issues it only under certain conditions (`access_type=offline`, `prompt=consent`, first time).


## License

This project template is provided as-is for internal use. Replace with your preferred license if needed.
