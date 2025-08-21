from app import app
from flask import render_template, request, redirect, url_for, session, flash
from app.db import verify_credentials, create_user, find_user_by_email, create_or_link_google_user
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from google_auth_oauthlib.flow import Flow
import secrets

@app.route('/')
def home():
	return render_template('index.html')

@app.route('/how-it-works/landlords')
def how_landlords():
	return render_template('how_landlords.html')

@app.route('/how-it-works/operators')
def how_operators():
	return render_template('how_operators.html')

@app.route('/resources/legality-map')
def legality_map():
	return render_template('legality_map.html')

@app.route('/resources/marketplace-listings')
def marketplace_listings():
	return render_template('marketplace_listings.html')

@app.route('/resources/templates')
def templates_resource():
	return render_template('templates_resource.html')

@app.route('/listings/list-property')
def list_property():
	return render_template('list_property.html')

@app.route('/listings/find-property')
def find_property():
	return render_template('find_property.html')

@app.route('/templates')
def templates_page():
	return render_template('templates_page.html')

@app.route('/services')
def services():
	return render_template('services.html')

@app.route('/privacy')
def privacy():
	return render_template('privacypolicy.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
	if request.method == 'GET' and session.get('user_id'):
		return redirect(url_for('home'))
	if request.method == 'POST':
		email = request.form.get('email', '').strip()
		password = request.form.get('password', '')
		user = verify_credentials(email, password)
		if user:
			session['user_id'] = user['id']
			session['user_email'] = user['email']
			flash('Logged in successfully.', 'success')
			return redirect(url_for('home'))
		flash('Invalid email or password.', 'error')
	return render_template('login.html')

@app.route('/forgotpassword')
def forgotpassword():
	return render_template('forgotpassword.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
	if request.method == 'GET' and session.get('user_id'):
		return redirect(url_for('home'))
	if request.method == 'POST':
		first_name = request.form.get('name')
		last_name = request.form.get('lastname')
		email = request.form.get('email', '').strip()
		phone = request.form.get('phone')
		password = request.form.get('password', '')
		confirm_password = request.form.get('confirm_password', '')

		if not email or not password:
			flash('Email and password are required.', 'error')
			return render_template('register.html')
		if password != confirm_password:
			flash('Passwords do not match.', 'error')
			return render_template('register.html')
		if find_user_by_email(email):
			flash('An account with that email already exists.', 'error')
			return render_template('register.html')

		user_id = create_user(email=email, password=password, first_name=first_name, last_name=last_name, phone=phone)
		session['user_id'] = user_id
		session['user_email'] = email
		flash('Account created. You are now signed in.', 'success')
		return redirect(url_for('home'))
	return render_template('register.html')

@app.route('/logout')
def logout():
	session.clear()
	flash('You have been signed out.', 'info')
	return redirect(url_for('home'))


@app.route('/filter-properties', methods=['POST'])
def filter_properties():
	return render_template('find_property.html')

@app.route('/property-details')
def property_details():
	return render_template('property_details.html')

@app.route('/property/<int:property_id>')
def view_property(property_id: int):
	return render_template('property_details.html', property_id=property_id)


# ----------------------------
# Google OAuth
# ----------------------------

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
GOOGLE_REDIRECT_URI_DEFAULT = os.getenv('GOOGLE_REDIRECT_URI', 'http://127.0.0.1:5000/auth/google/callback')


def _current_redirect_uri() -> str:
	"""Build redirect URI for the current host.

	- In production on host-bridge.com → use https://<host>/auth/google/callback
	- In dev → use incoming scheme and host (e.g., http://127.0.0.1:5000)
	- Fallback to GOOGLE_REDIRECT_URI_DEFAULT if request is unavailable
	"""
	try:
		host = request.host
		if not host:
			return GOOGLE_REDIRECT_URI_DEFAULT
		if 'host-bridge.com' in host:
			return f"https://{host}/auth/google/callback"
		scheme = request.headers.get('X-Forwarded-Proto', request.scheme)
		return f"{scheme}://{host}/auth/google/callback"
	except Exception:
		return GOOGLE_REDIRECT_URI_DEFAULT


def _build_flow() -> Flow:
	flow = Flow.from_client_config(
		client_config={
			'web': {
				'client_id': GOOGLE_CLIENT_ID,
				'client_secret': GOOGLE_CLIENT_SECRET,
				'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
				'token_uri': 'https://oauth2.googleapis.com/token',
			}
		},
		scopes=[
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email',
			'openid'
		],
	)
	flow.redirect_uri = _current_redirect_uri()
	return flow


@app.route('/login/google')
def login_google():
	if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
		flash('Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.', 'error')
		return redirect(url_for('login'))

	flow = _build_flow()
	state = secrets.token_urlsafe(32)
	session['oauth_state'] = state
	next_url = request.args.get('next') or url_for('home')
	session['oauth_next'] = next_url
	auth_url, _ = flow.authorization_url(
		access_type='offline',
		include_granted_scopes='true',
		prompt='consent',
		state=state,
	)
	return redirect(auth_url)


@app.route('/auth/google/callback')
def auth_google_callback():
	if 'oauth_state' not in session or session['oauth_state'] != request.args.get('state'):
		flash('Invalid login state. Please try again.', 'error')
		return redirect(url_for('login'))

	flow = _build_flow()
	try:
		flow.fetch_token(authorization_response=request.url)
	except Exception as e:
		print(f"DEBUG: Google auth failed during token fetch: {e}")
		flash(f'Google auth failed: {e}', 'error')
		return redirect(url_for('login'))

	credentials = flow.credentials
	request_adapter = google_requests.Request()
	try:
		idinfo = id_token.verify_oauth2_token(
			credentials.id_token,
			request_adapter,
			GOOGLE_CLIENT_ID,
			clock_skew_in_seconds=120
		)
	except Exception as e:
		print(f"DEBUG: Google ID token verification failed: {e}")
		flash(f'Could not verify Google ID token: {e}', 'error')
		return redirect(url_for('login'))

	google_sub = idinfo.get('sub')
	email = idinfo.get('email')
	name = idinfo.get('name')
	picture = idinfo.get('picture')

	try:
		user = create_or_link_google_user(google_sub=google_sub, email=email, name=name, picture_url=picture)
		session['user_id'] = user['id']
		session['user_email'] = user.get('email')
		session.pop('oauth_state', None)
		session.pop('oauth_next', None)
		flash('Signed in with Google.', 'success')
		print(f"DEBUG: Google auth successful, redirecting to home")
		return redirect(url_for('home'))
	except Exception as e:
		print(f"DEBUG: Failed to create user account: {e}")
		flash(f'Failed to create user account: {e}', 'error')
		return redirect(url_for('login'))
