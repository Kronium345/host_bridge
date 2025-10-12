# HostBridge (Flask + SQLite)

**🌐 Live Demo:** [https://host-bridge.onrender.com](https://host-bridge.onrender.com)

**Production:** Change "python run.py" to "gunicorn run:app" for future upgrade

HostBridge is a web app for connecting landlords and short‑term rental (STR) operators, providing compliance resources, listings, and onboarding tools. It includes:

- Static marketing pages and templates
- Account registration/login with hashed passwords (SQLite)
- Optional Google Sign‑In (server‑side OAuth 2.0 / OIDC)
- Clean seagreen/white theme with a responsive navbar
- Complete verification system with file uploads and document management
- Interactive STR legality map with UK region coloring
- Multiple contact forms with EmailJS integration
- Feature showcase with mockups on homepage


## Project structure

```
Host_bridge/Host_bridge/
  app/
    __init__.py          # Flask app factory and DB init
    db.py                # SQLite helpers, user auth, and verification utilities
    routes.py            # All routes (pages + auth + Google OAuth + verification)
    static/
      css/
        styles.css       # Global styles (includes auth + privacy + contact styles)
        showcase.css     # Feature showcase mockups styling
        verification.css # Verification page styling
      js/
        email.js         # EmailJS form handling
        map.js           # Interactive STR legality map
        verification.js  # Verification form handling and AJAX
      images/            # Static images (logos, icons)
    templates/           # Jinja templates extending base.html
  database/
    hostbridge.db        # SQLite DB file (auto-created on first run)
  uploads/
    verification/        # Uploaded verification documents (auto-created)
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
  - `init_db()` — creates the `users`, `verification_documents`, and `user_verification_status` tables
  - `create_user(email, password, ...)` — stores a hashed password
  - `verify_credentials(email, password)` — checks login
  - `create_or_link_google_user(google_sub, email, name, picture_url)` — links or creates a Google user
  - `save_verification_document()` — saves uploaded verification documents
  - `get_user_verification_status()` — retrieves verification progress
  - `check_verification_completion()` — validates if all verification steps are complete

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
- `EMAILJS_PUBLIC_KEY` — EmailJS public key for contact forms
- `EMAILJS_SERVICE_ID` — EmailJS service ID
- `EMAILJS_TEMPLATE_ID` — EmailJS template ID for general forms
- `EMAILJS_NEWSLETTER_TEMPLATE_ID` — EmailJS template ID for newsletter signup


## Features

### Authentication & Security
- **User Registration & Login** with password hashing
- **Google OAuth 2.0** integration for social login
- **Password Reset System** with secure token generation
  - Email-based reset links via EmailJS
  - Token expiration (1 hour validity)
  - Secure password updates
  - Token usage tracking

### Verification System
- **Complete document upload workflow** for identity, address, and role verification
- **File validation** (PDF, PNG, JPG, JPEG up to 5MB)
- **Secure file storage** with unique filenames and database tracking
- **Real-time status updates** with AJAX and toast notifications
- **Multi-step progress tracking** with visual indicators

### Interactive Map
- **STR Legality Map** showing UK regions with color-coded permissions
- **Dynamic region coloring** (Green: Permitted, Orange: Restricted, Red: Not Permitted)
- **Clickable regions** with popup information
- **Postcode search** functionality

### Contact Forms
- **Multiple EmailJS-integrated forms** across different pages
- **Role-specific registration forms** for landlords, operators, and services
- **Modern contact page** with direct contact info and message form

### Homepage Showcase
- **Feature mockups** showing key platform capabilities
- **Interactive previews** of listings, profiles, messaging, templates, map, and calendar
- **Real content integration** with actual images and data

## Styling

Styles are organized across multiple CSS files:
- `app/static/css/styles.css` — Global styles, auth, contact, templates, verification
- `app/static/css/showcase.css` — Homepage feature showcase mockups
- `app/static/css/verification.css` — Verification page specific styling

Sections include:
- Navbar, hero, sections
- Auth pages (login/register/forgot password)
- Privacy policy (`/privacy`)
- Contact page with modern card design
- Verification system with step-by-step workflow
- Templates page with premium/free document distinction


## Deployment notes

- Set environment variables in your host (never commit secrets):
  - `FLASK_SECRET_KEY` (required)
  - `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` (if using Google Sign‑In)
- Ensure your production URL matches the OAuth redirect URI (`https://host-bridge.com/auth/google/callback`).
- Run with a production server (e.g., gunicorn behind nginx) and HTTPS enabled.

## API Endpoints

### Authentication
- `POST /login` — User login with email and password
- `POST /register` — User registration
- `GET /login/google` — Google OAuth login initiation
- `POST /api/forgot-password` — Request password reset (returns token and reset URL)
- `GET /reset-password/<token>` — Validate reset token and show password reset form
- `POST /reset-password/<token>` — Update password with valid token

### Verification System
- `POST /api/verify/upload/<document_type>` — Upload verification documents (identity/address/role)
- `GET /api/verify/status` — Get current verification status for logged-in user

### Ratings
- `POST /api/ratings` — Submit a new rating
- `GET /api/ratings/<target_type>/<target_id>` — Get ratings for a specific target

### File Upload
- **Supported formats**: PDF, PNG, JPG, JPEG
- **Max file size**: 5MB per file
- **Storage location**: `uploads/verification/` (auto-created)
- **Security**: Unique filenames, secure file handling, database tracking

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


## Deployment

### Backend (Render) - Already Deployed ✅
**Live URL**: https://host-bridge.onrender.com

The Flask backend is deployed on Render with:
- Build Command: `pip install -r requirements.txt`
- Start Command: `python run.py`
- Environment variables configured for EmailJS and Google OAuth

### Frontend (Hostinger) - Static HTML Deployment

All templates have been converted to static HTML for Hostinger deployment.

#### 📁 Files for Hostinger File Manager:

**1. HTML Files** (from `static_html/` folder):
- Upload all 16 `.html` files to `public_html/`
- Files: `index.html`, `contact.html`, `how_landlords.html`, `how_operators.html`, `services.html`, `legality_map.html`, `templates_resource.html`, `verify.html`, `marketplace_listings.html`, `property_details.html`, `login.html`, `register.html`, `list_property.html`, `find_property.html`, `forgotpassword.html`, `privacypolicy.html`

**2. Static Assets** (from `app/static/` folder):
```
public_html/
├── css/
│   ├── styles.css
│   ├── showcase.css
│   └── verification.css
├── js/
│   ├── email.js
│   ├── legality_map.js
│   ├── showcase_map.js
│   ├── verification.js
│   ├── toast.js
│   └── map.js
├── images/
│   └── (all image files: favicon.ico, final.png, house-*.jpg, etc.)
└── data/
    └── uk_str_regulations.json
```

#### 🔧 Configuration (Already Done ✅):
- All API calls in `verification.js` point to: `https://host-bridge.onrender.com`
- EmailJS credentials hardcoded in HTML files
- All `url_for()` calls converted to relative paths (`./page.html`)

#### ✅ What Works on Hostinger:
- All static pages and navigation
- Contact forms (EmailJS)
- Interactive maps (AnyChart)
- All styling and design
- Verification system (connects to Render backend)

#### 🚀 Quick Deploy Steps:
1. Upload all files from `static_html/` to Hostinger `public_html/`
2. Create folders: `css/`, `js/`, `images/`, `data/`
3. Upload `app/static/` contents to respective folders
4. Test your site - all backend API calls automatically go to Render!

## License

This project template is provided as-is for internal use. Replace with your preferred license if needed.
