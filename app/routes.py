from app import app
from flask import render_template, request, redirect, url_for, session, flash, jsonify, send_from_directory
from flask_login import login_user, logout_user, current_user, login_required
from app.db import (verify_credentials, create_user, find_user_by_email, create_or_link_google_user,
                     save_verification_document, get_user_verification_status, 
                     get_user_verification_documents, check_verification_completion,
                     save_rating, get_ratings_for_target, calculate_average_rating,
                     create_password_reset_token, get_password_reset_token, mark_token_as_used,
                     update_user_password, delete_expired_tokens, get_user_by_id,
                     create_booking, get_user_bookings, get_property_bookings,
                     create_testimonial, get_approved_testimonials, get_user_testimonial)
# from app.email_service import send_welcome_email, send_login_notification_email
 from app.email_service_sendgrid import send_welcome_email, send_login_notification_email
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from google_auth_oauthlib.flow import Flow
import secrets
from werkzeug.utils import secure_filename
import hashlib
from datetime import datetime

@app.route('/')
@app.route('/index.html')
def home():
	emailjs_public = os.getenv('EMAILJS_PUBLIC_KEY', '')
	emailjs_service = os.getenv('EMAILJS_SERVICE_ID', '')
	# Try contact template first, then newsletter template as fallback
	emailjs_template = os.getenv('EMAILJS_CONTACT_TEMPLATE_ID', os.getenv('EMAILJS_NEWSLETTER_TEMPLATE_ID', os.getenv('EMAILJS_TEMPLATE_ID', '')))
	return render_template(
		'index.html',
		EMAILJS_PUBLIC=emailjs_public,
		EMAILJS_SERVICE=emailjs_service,
		EMAILJS_TEMPLATE=emailjs_template,
	)

# ----------------------------
# Local dev helpers to serve static_html pages
# ----------------------------

# Root of the repository → static_html lives alongside the app package
STATIC_HTML_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static_html')

@app.route('/login.html')
def serve_login_html():
	"""Serve static_html/login.html for local development."""
	try:
		return send_from_directory(STATIC_HTML_DIR, 'login.html')
	except Exception:
		# Fallback to dynamic route if file is missing
		return redirect(url_for('login'))

@app.route('/register.html')
def serve_register_html():
	"""Serve static_html/register.html for local development."""
	try:
		return send_from_directory(STATIC_HTML_DIR, 'register.html')
	except Exception:
		# Fallback to dynamic route if file is missing
		return redirect(url_for('register'))

@app.route('/css/<path:filename>')
def serve_static_html_css(filename):
	return send_from_directory(os.path.join(STATIC_HTML_DIR, 'css'), filename)

@app.route('/js/<path:filename>')
def serve_static_html_js(filename):
	return send_from_directory(os.path.join(STATIC_HTML_DIR, 'js'), filename)

@app.route('/images/<path:filename>')
def serve_static_html_images(filename):
	return send_from_directory(os.path.join(STATIC_HTML_DIR, 'images'), filename)

@app.route('/data/<path:filename>')
def serve_static_html_data(filename):
	return send_from_directory(os.path.join(STATIC_HTML_DIR, 'data'), filename)

@app.route('/how-it-works/landlords')
def how_landlords():
	emailjs_public = os.getenv('EMAILJS_PUBLIC_KEY', '')
	emailjs_service = os.getenv('EMAILJS_SERVICE_ID', '')
	emailjs_template = os.getenv('EMAILJS_NEWSLETTER_TEMPLATE_ID', os.getenv('EMAILJS_TEMPLATE_ID', ''))
	return render_template(
		'how_landlords.html',
		EMAILJS_PUBLIC=emailjs_public,
		EMAILJS_SERVICE=emailjs_service,
		EMAILJS_TEMPLATE=emailjs_template,
	)

@app.route('/how-it-works/operators')
def how_operators():
	emailjs_public = os.getenv('EMAILJS_PUBLIC_KEY', '')
	emailjs_service = os.getenv('EMAILJS_SERVICE_ID', '')
	emailjs_template = os.getenv('EMAILJS_NEWSLETTER_TEMPLATE_ID', os.getenv('EMAILJS_TEMPLATE_ID', ''))
	return render_template(
		'how_operators.html',
		EMAILJS_PUBLIC=emailjs_public,
		EMAILJS_SERVICE=emailjs_service,
		EMAILJS_TEMPLATE=emailjs_template,
	)

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
	emailjs_public = os.getenv('EMAILJS_PUBLIC_KEY', '')
	emailjs_service = os.getenv('EMAILJS_SERVICE_ID', '')
	emailjs_template = os.getenv('EMAILJS_NEWSLETTER_TEMPLATE_ID', os.getenv('EMAILJS_TEMPLATE_ID', ''))
	return render_template(
		'services.html',
		EMAILJS_PUBLIC=emailjs_public,
		EMAILJS_SERVICE=emailjs_service,
		EMAILJS_TEMPLATE=emailjs_template,
	)

@app.route('/contact')
def contact():
	emailjs_public = os.getenv('EMAILJS_PUBLIC_KEY', '')
	emailjs_service = os.getenv('EMAILJS_SERVICE_ID', '')
	# Prefer a dedicated contact template; fall back to general template
	emailjs_template = os.getenv('EMAILJS_CONTACT_TEMPLATE_ID', os.getenv('EMAILJS_TEMPLATE_ID', ''))
	return render_template(
		'contact.html',
		EMAILJS_PUBLIC=emailjs_public,
		EMAILJS_SERVICE=emailjs_service,
		EMAILJS_TEMPLATE=emailjs_template,
	)

@app.route('/privacy')
def privacy():
	return render_template('privacypolicy.html')

@app.route('/landlord/submit', methods=['POST'])
def submit_property():
	"""Receive landlord property submissions. Stores or logs for now, then flashes feedback."""
	rent = request.form.get('rent', '').strip()
	deposit = request.form.get('deposit', '').strip()
	furnishing = request.form.get('furnishing', '').strip()
	beds = request.form.get('beds', '').strip()
	baths = request.form.get('baths', '').strip()
	area = request.form.get('area', '').strip()
	has_cleaner = request.form.get('has_cleaner', '').strip()
	notes = request.form.get('notes', '').strip()

	missing = []
	if not rent: missing.append('rent')
	if not deposit: missing.append('deposit')
	if not furnishing: missing.append('furnishing')
	if not beds: missing.append('beds')
	if not baths: missing.append('baths')
	if not area: missing.append('area')
	if not has_cleaner: missing.append('existing cleaner')

	if missing:
		error_msg = f"Please provide: {', '.join(missing)}."
		if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
			return jsonify({'error': error_msg}), 400
		flash(error_msg, 'error')
		return redirect('https://host-bridge.com/how_landlords.html')

	print('DEBUG: Landlord submission:', {
		'rent': rent,
		'deposit': deposit,
		'furnishing': furnishing,
		'beds': beds,
		'baths': baths,
		'area': area,
		'has_cleaner': has_cleaner,
		'notes': notes,
	})

	success_msg = 'Thanks! Your property details were submitted. We will be in touch shortly.'
	if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
		return jsonify({'success': success_msg})
	flash(success_msg, 'success')
	return redirect('https://host-bridge.com/how_landlords.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
	# Determine redirect URL based on environment
	is_local = request.host.startswith('127.0.0.1') or request.host.startswith('localhost')
	redirect_url = 'http://127.0.0.1:5000/index.html' if is_local else 'https://host-bridge.com/index.html'
	
	if request.method == 'GET' and session.get('user_id'):
		return redirect(redirect_url)
	if request.method == 'POST':
		email = request.form.get('email', '').strip()
		password = request.form.get('password', '')
		user = verify_credentials(email, password)
		if user:
			from app import User
			user_obj = User(
				user_id=user['id'],
				email=user['email'],
				first_name=user.get('first_name'),
				last_name=user.get('last_name'),
				role=user.get('role', 'user')
			)
			login_user(user_obj)
			flash('Logged in successfully.', 'success')
			
			# Send login notification email
			try:
				user_name = user.get('first_name') or email.split('@')[0]
				send_login_notification_email(email, user_name)
			except Exception as e:
				print(f"Failed to send login notification email: {e}")
			
			# For AJAX requests, return JSON instead of redirecting
			if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
				return jsonify({'success': True, 'redirect_url': redirect_url})
			
			return redirect(redirect_url)
		
		error_msg = 'Invalid email or password.'
		if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
			return jsonify({'error': error_msg}), 400
		flash(error_msg, 'error')
		return redirect(redirect_url.replace('/index.html', '/login.html'))
	
	return redirect(redirect_url.replace('/index.html', '/login.html'))

@app.route('/forgotpassword', methods=['GET', 'POST'])
def forgotpassword():
	if request.method == 'POST':
		email = request.form.get('email', '').strip().lower()
		if not email:
			flash('Please provide an email address.', 'error')
			return redirect('https://host-bridge.com/forgotpassword.html')
		
		# Check if user exists
		user = find_user_by_email(email)
		if not user:
			# Don't reveal if email exists or not (security best practice)
			flash('If that email is registered, you will receive a password reset link shortly.', 'success')
			return redirect('https://host-bridge.com/forgotpassword.html')
		
		# Generate secure token
		token = secrets.token_urlsafe(32)
		
		# Token expires in 1 hour
		from datetime import datetime, timedelta
		expires_at = (datetime.now() + timedelta(hours=1)).isoformat()
		
		# Save token to database
		create_password_reset_token(user['id'], token, expires_at)
		
		flash('If that email is registered, you will receive a password reset link shortly.', 'success')
		return redirect('https://host-bridge.com/login.html')
	
	
	return redirect('https://host-bridge.com/forgotpassword.html')


@app.route('/api/forgot-password', methods=['POST'])
def api_forgot_password():
	"""API endpoint for password reset token generation"""
	email = request.form.get('email', '').strip().lower()
	if not email:
		return jsonify({'success': False, 'message': 'Email is required'}), 400
	
	# Check if user exists
	user = find_user_by_email(email)
	if not user:
		# Don't reveal if email exists or not (security best practice)
		return jsonify({'success': False, 'message': 'If that email is registered, you will receive a reset link shortly.'})
	
	# Generate secure token
	token = secrets.token_urlsafe(32)
	
	# Token expires in 1 hour
	from datetime import datetime, timedelta
	expires_at = (datetime.now() + timedelta(hours=1)).isoformat()
	
	# Save token to database
	create_password_reset_token(user['id'], token, expires_at)
	
	# Create reset URL (use Hostinger URL for the reset page)
	reset_url = f"https://host-bridge.com/reset_password.html?token={token}"
	
	return jsonify({
		'success': True,
		'reset_url': reset_url,
		'user_name': user.get('first_name', 'User')
	})


@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
	"""Handle password reset with token"""
	delete_expired_tokens()
	
	if request.method == 'GET':
		# Verify token is valid
		token_data = get_password_reset_token(token)
		if not token_data:
			flash('Invalid or expired reset link.', 'error')
			return redirect('https://host-bridge.com/forgotpassword.html')
		
		# Check if token is expired
		from datetime import datetime
		expires_at = datetime.fromisoformat(token_data['expires_at'])
		if datetime.now() > expires_at:
			flash('This reset link has expired. Please request a new one.', 'error')
			return redirect('https://host-bridge.com/forgotpassword.html')
		
		return redirect(f'https://host-bridge.com/reset_password.html?token={token}')
	
	elif request.method == 'POST':
		# Handle password update
		new_password = request.form.get('password', '').strip()
		confirm_password = request.form.get('confirm_password', '').strip()
		
		if not new_password or not confirm_password:
			flash('Please fill in all fields.', 'error')
			return redirect(f'https://host-bridge.com/reset_password.html?token={token}')
		
		if new_password != confirm_password:
			flash('Passwords do not match.', 'error')
			return redirect(f'https://host-bridge.com/reset_password.html?token={token}')
		
		if len(new_password) < 6:
			flash('Password must be at least 6 characters long.', 'error')
			return redirect(f'https://host-bridge.com/reset_password.html?token={token}')
		
		# Verify token again
		token_data = get_password_reset_token(token)
		if not token_data:
			flash('Invalid or expired reset link.', 'error')
			return redirect('https://host-bridge.com/forgotpassword.html')
		
		# Check if token is expired
		from datetime import datetime
		expires_at = datetime.fromisoformat(token_data['expires_at'])
		if datetime.now() > expires_at:
			flash('This reset link has expired. Please request a new one.', 'error')
			return redirect('https://host-bridge.com/forgotpassword.html')
		
		# Update password
		update_user_password(token_data['user_id'], new_password)
		
		# Mark token as used
		mark_token_as_used(token)
		
		flash('Your password has been reset successfully! You can now log in.', 'success')
		return redirect('https://host-bridge.com/login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
	# Determine redirect URL based on environment
	is_local = request.host.startswith('127.0.0.1') or request.host.startswith('localhost')
	redirect_url = 'http://127.0.0.1:5000/index.html' if is_local else 'https://host-bridge.com/index.html'
	
	if request.method == 'GET' and session.get('user_id'):
		return redirect(redirect_url)
	if request.method == 'POST':
		first_name = request.form.get('name')
		last_name = request.form.get('lastname')
		email = request.form.get('email', '').strip()
		phone = request.form.get('phone')
		password = request.form.get('password', '')
		confirm_password = request.form.get('confirm_password', '')
		role_param = request.form.get('role', 'user').strip() 
		if not email or not password:
			error_msg = 'Email and password are required.'
			if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
				return jsonify({'error': error_msg}), 400
			flash(error_msg, 'error')
			return redirect(redirect_url.replace('/index.html', '/register.html'))
		if password != confirm_password:
			error_msg = 'Passwords do not match.'
			if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
				return jsonify({'error': error_msg}), 400
			flash(error_msg, 'error')
			return redirect(redirect_url.replace('/index.html', '/register.html'))
		if find_user_by_email(email):
			error_msg = 'An account with that email already exists.'
			if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
				return jsonify({'error': error_msg}), 400
			flash(error_msg, 'error')
			return redirect(redirect_url.replace('/index.html', '/register.html'))

		# Create user with role (landlord, operator, or user)
		user_id = create_user(
			email=email, 
			password=password, 
			first_name=first_name, 
			last_name=last_name, 
			phone=phone,
			role=role_param if role_param in ['landlord', 'operator'] else 'user'
		)
		
		from app import User
		user_obj = User(
			user_id=user_id,
			email=email,
			first_name=first_name,
			last_name=last_name,
			role=role_param if role_param in ['landlord', 'operator'] else 'user'
		)
		login_user(user_obj)
		flash('Account created. You are now signed in.', 'success')
		
		# Send welcome email
		try:
			user_name = first_name or email.split('@')[0]
			send_welcome_email(email, user_name, role_param if role_param in ['landlord', 'operator'] else 'user')
		except Exception as e:
			print(f"Failed to send welcome email: {e}")
		
		# For AJAX requests, return JSON instead of redirecting
		if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
			return jsonify({'success': True, 'redirect_url': redirect_url})
		
		# Redirect to appropriate frontend after successful registration
		return redirect(redirect_url)
	
	return redirect(redirect_url.replace('/index.html', '/register.html'))

@app.route('/api/user/status', methods=['GET'])
def get_user_status():
	"""API endpoint to check if user is logged in"""
	print(f"DEBUG: /api/user/status called")
	print(f"DEBUG: current_user: {current_user}")
	
	if current_user.is_authenticated:
		print(f"DEBUG: User found: {current_user.id}")
		return jsonify({
			'logged_in': True,
			'user': {
				'id': current_user.id,
				'email': current_user.email,
				'first_name': current_user.first_name,
				'last_name': current_user.last_name,
				'role': current_user.role
			}
		})
	
	print(f"DEBUG: Returning logged_in: False")
	return jsonify({'logged_in': False})

@app.route('/logout')
def logout():
	logout_user()
	flash('You have been signed out.', 'info')
	# Determine redirect URL based on environment
	is_local = request.host.startswith('127.0.0.1') or request.host.startswith('localhost')
	redirect_url = url_for('home', _external=False) if is_local else 'https://host-bridge.com/index.html'
	return redirect(redirect_url)


@app.route('/filter-properties', methods=['POST'])
def filter_properties():
	return render_template('find_property.html')

@app.route('/property-details')
def property_details():
	return render_template('property_details.html')

@app.route('/property/<int:property_id>')
def view_property(property_id: int):
	return render_template('property_details.html', property_id=property_id)

@app.route('/verify')
def verify():
	verification_status = None
	verification_docs = []
	
	if current_user.is_authenticated:
		verification_status = get_user_verification_status(current_user.id)
		verification_docs = get_user_verification_documents(current_user.id)
	
	return render_template('verify.html', 
	                      verification_status=verification_status,
	                      verification_docs=verification_docs)


# ----------------------------
# File Upload Configuration
# ----------------------------

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'verification')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_size(file):
	"""Check if file size is within limits."""
	file.seek(0, os.SEEK_END)
	file_size = file.tell()
	file.seek(0)  # Reset file pointer
	return file_size <= MAX_FILE_SIZE

def generate_unique_filename(original_filename, user_id):
	"""Generate a unique filename using hash and timestamp."""
	timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
	ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else 'bin'
	hash_str = hashlib.md5(f"{user_id}_{timestamp}_{original_filename}".encode()).hexdigest()[:8]
	return f"{user_id}_{timestamp}_{hash_str}.{ext}"


# ----------------------------
# Verification Upload Routes
# ----------------------------

@app.route('/api/verify/upload/<document_type>', methods=['POST'])
@login_required
def upload_verification_document(document_type):
	"""Handle file upload for verification documents."""
	
	user_id = current_user.id
	
	# Validate document type
	valid_types = ['identity', 'address', 'role']
	if document_type not in valid_types:
		return jsonify({'success': False, 'message': 'Invalid document type'}), 400
	
	# Check for files in request
	if document_type == 'identity':
		file_keys = ['id_document', 'id_document_back']
	elif document_type == 'address':
		file_keys = ['address_document']
	else:  # role
		file_keys = ['role_document']
	
	uploaded_files = []
	errors = []
	
	for file_key in file_keys:
		if file_key not in request.files:
			if file_key.endswith('_back'):  # Optional back document
				continue
			errors.append(f'No file provided for {file_key}')
			continue
		
		file = request.files[file_key]
		
		if file.filename == '':
			if file_key.endswith('_back'):  # Optional back document
				continue
			errors.append(f'No file selected for {file_key}')
			continue
		
		# Validate file type
		if not allowed_file(file.filename):
			errors.append(f'Invalid file type for {file.filename}. Only PDF, PNG, JPG, JPEG allowed')
			continue
		
		# Validate file size
		if not validate_file_size(file):
			errors.append(f'File {file.filename} is too large. Maximum size is 5MB')
			continue
		
		# Generate unique filename and save
		original_filename = secure_filename(file.filename)
		unique_filename = generate_unique_filename(original_filename, user_id)
		file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
		
		try:
			file.save(file_path)
			file_size = os.path.getsize(file_path)
			
			# Get document subtype from form data
			document_subtype = None
			if document_type == 'identity':
				document_subtype = request.form.get('id_type')
			elif document_type == 'role':
				document_subtype = request.form.get('role_type')
			
			# Save to database
			doc_id = save_verification_document(
				user_id=user_id,
				document_type=document_type,
				document_subtype=document_subtype,
				file_path=file_path,
				file_name=original_filename,
				file_size=file_size
			)
			
			uploaded_files.append({
				'id': doc_id,
				'filename': original_filename,
				'type': document_type
			})
			
		except Exception as e:
			errors.append(f'Failed to upload {file.filename}: {str(e)}')
			# Clean up file if database save failed
			if os.path.exists(file_path):
				os.remove(file_path)
	
	if errors and not uploaded_files:
		return jsonify({'success': False, 'message': '; '.join(errors)}), 400
	
	# Check if verification is complete
	completion_status = check_verification_completion(user_id)
	
	response_message = f'{len(uploaded_files)} document(s) uploaded successfully'
	if errors:
		response_message += f'. {len(errors)} file(s) had errors'
	
	if completion_status['all_complete']:
		response_message = 'Verification complete! All documents have been uploaded and are pending review.'
	
	return jsonify({
		'success': True,
		'message': response_message,
		'uploaded': uploaded_files,
		'errors': errors if errors else None,
		'completion_status': completion_status
	}), 200


@app.route('/api/verify/status', methods=['GET'])
@login_required
def get_verification_status():
	"""Get current verification status for logged-in user."""
	
	user_id = current_user.id
	status = get_user_verification_status(user_id)
	docs = get_user_verification_documents(user_id)
	completion = check_verification_completion(user_id)
	
	return jsonify({
		'success': True,
		'status': status,
		'documents': [
			{
				'id': doc['id'],
				'type': doc['document_type'],
				'subtype': doc['document_subtype'],
				'filename': doc['file_name'],
				'status': doc['status'],
				'uploaded_at': doc['uploaded_at']
			} for doc in docs
		],
		'completion': completion
	}), 200


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
		return redirect('https://host-bridge.com/login.html')

	flow = _build_flow()
	state = secrets.token_urlsafe(32)
	session['oauth_state'] = state
	next_url = request.args.get('next') or 'https://host-bridge.com/index.html'
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
	# Determine redirect URL based on environment
	is_local = request.host.startswith('127.0.0.1') or request.host.startswith('localhost')
	redirect_url = 'http://127.0.0.1:5000/index.html' if is_local else 'https://host-bridge.com/index.html'
	login_redirect = redirect_url.replace('/index.html', '/login.html')
	
	if 'oauth_state' not in session or session['oauth_state'] != request.args.get('state'):
		flash('Invalid login state. Please try again.', 'error')
		return redirect(login_redirect)

	flow = _build_flow()
	try:
		flow.fetch_token(authorization_response=request.url)
	except Exception as e:
		print(f"DEBUG: Google auth failed during token fetch: {e}")
		flash(f'Google auth failed: {e}', 'error')
		return redirect(login_redirect)

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
		return redirect(login_redirect)

	google_sub = idinfo.get('sub')
	email = idinfo.get('email')
	name = idinfo.get('name')
	picture = idinfo.get('picture')

	try:
		user = create_or_link_google_user(google_sub=google_sub, email=email, name=name, picture_url=picture)
		from app import User
		user_obj = User(
			user_id=user['id'],
			email=user.get('email'),
			first_name=user.get('first_name'),
			last_name=user.get('last_name'),
			role=user.get('role', 'user')
		)
		login_user(user_obj)
		session.pop('oauth_state', None)
		session.pop('oauth_next', None)
		flash('Signed in with Google.', 'success')
		print(f"DEBUG: Google auth successful, redirecting to frontend")
		# Redirect to appropriate frontend after Google OAuth
		return redirect(redirect_url)
	except Exception as e:
		print(f"DEBUG: Failed to create user account: {e}")
		flash(f'Failed to create user account: {e}', 'error')
		return redirect(login_redirect)

# Rating API endpoints
@app.route('/api/ratings', methods=['POST'])
def submit_rating():
	"""Submit a new rating"""
	try:
		data = request.get_json()
		
		# Validate required fields
		if not data or 'rating' not in data:
			return jsonify({'success': False, 'message': 'Rating is required'}), 400
		
		rating = data['rating']
		if not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
			return jsonify({'success': False, 'message': 'Rating must be between 1 and 5'}), 400
		
		# Get user info (optional - can work without login)
		user_id = session.get('user_id')
		user_email = session.get('user_email')
		
		# Prepare rating data
		rating_data = {
			'rating': float(rating),
			'comment': data.get('comment', ''),
			'target_id': data.get('targetId', 'general'),
			'target_type': data.get('targetType', 'general'),
			'user_id': user_id,
			'user_email': user_email,
			'timestamp': data.get('timestamp', datetime.now().isoformat())
		}
		
		# Save to database
		rating_id = save_rating(rating_data)
		
		return jsonify({
			'success': True, 
			'message': 'Rating submitted successfully',
			'rating_id': rating_id
		})
		
	except Exception as e:
		print(f"Error submitting rating: {e}")
		return jsonify({'success': False, 'message': 'Failed to submit rating'}), 500

@app.route('/api/ratings/<target_type>/<target_id>', methods=['GET'])
def get_ratings(target_type, target_id):
	"""Get ratings for a specific target"""
	try:
		ratings = get_ratings_for_target(target_type, target_id)
		
		return jsonify({
			'success': True,
			'ratings': ratings,
			'average_rating': calculate_average_rating(ratings),
			'total_ratings': len(ratings)
		})
		
	except Exception as e:
		print(f"Error fetching ratings: {e}")
		return jsonify({'success': False, 'message': 'Failed to fetch ratings'}), 500


# -----------------------
# Booking System Routes
# -----------------------

@app.route('/api/booking/create', methods=['POST'])
@login_required
def create_booking_api():
	"""Create a new booking - requires login"""
	
	try:
		data = request.get_json()
		property_id = data.get('property_id', 1)  # Default to property 1
		booking_date = data.get('booking_date')
		booking_time = data.get('booking_time')
		message = data.get('message', '')
		
		if not booking_date:
			return jsonify({'success': False, 'message': 'Booking date is required'}), 400
		
		user_id = current_user.id
		booking_id = create_booking(user_id, property_id, booking_date, booking_time, message)
		
		return jsonify({
			'success': True, 
			'message': f'Booking created successfully for {booking_date}',
			'booking_id': booking_id
		})
		
	except Exception as e:
		print(f"Error creating booking: {e}")
		return jsonify({'success': False, 'message': 'Failed to create booking'}), 500


@app.route('/api/booking/user', methods=['GET'])
@login_required
def get_user_bookings_api():
	"""Get user's bookings - requires login"""
	
	try:
		user_id = current_user.id
		bookings = get_user_bookings(user_id)
		return jsonify({'success': True, 'bookings': bookings})
		
	except Exception as e:
		print(f"Error fetching bookings: {e}")
		return jsonify({'success': False, 'message': 'Failed to fetch bookings'}), 500


# -----------------------
# Testimonial System Routes
# -----------------------

@app.route('/api/testimonial/create', methods=['POST'])
@login_required
def create_testimonial_api():
	"""Create a new testimonial - requires login"""
	
	try:
		data = request.get_json()
		rating = data.get('rating')
		comment = data.get('comment', '').strip()
		
		if not rating or rating < 1 or rating > 5:
			return jsonify({'success': False, 'message': 'Rating must be between 1 and 5'}), 400
		
		if not comment:
			return jsonify({'success': False, 'message': 'Comment is required'}), 400
		
		user_id = current_user.id
		
		# Check if user already has a testimonial
		existing = get_user_testimonial(user_id)
		if existing:
			return jsonify({'success': False, 'message': 'You have already submitted a testimonial'}), 400
		
		testimonial_id = create_testimonial(user_id, rating, comment)
		
		return jsonify({
			'success': True, 
			'message': 'Testimonial submitted successfully! It will be reviewed before being published.',
			'testimonial_id': testimonial_id
		})
		
	except Exception as e:
		print(f"Error creating testimonial: {e}")
		return jsonify({'success': False, 'message': 'Failed to submit testimonial'}), 500


@app.route('/api/testimonials/approved', methods=['GET'])
def get_approved_testimonials_api():
	"""Get approved testimonials for display"""
	try:
		testimonials = get_approved_testimonials()
		return jsonify({'success': True, 'testimonials': testimonials})
		
	except Exception as e:
		print(f"Error fetching testimonials: {e}")
		return jsonify({'success': False, 'message': 'Failed to fetch testimonials'}), 500


@app.route('/api/testimonial/user', methods=['GET'])
@login_required
def get_user_testimonial_api():
	"""Get user's testimonial - requires login"""
	
	try:
		user_id = current_user.id
		testimonial = get_user_testimonial(user_id)
		return jsonify({'success': True, 'testimonial': testimonial})
		
	except Exception as e:
		print(f"Error fetching user testimonial: {e}")
		return jsonify({'success': False, 'message': 'Failed to fetch testimonial'}), 500
