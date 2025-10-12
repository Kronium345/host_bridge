from app import app
from flask import render_template, request, redirect, url_for, session, flash, jsonify
from app.db import (verify_credentials, create_user, find_user_by_email, create_or_link_google_user,
                     save_verification_document, get_user_verification_status, 
                     get_user_verification_documents, check_verification_completion,
                     save_rating, get_ratings_for_target, calculate_average_rating)
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from google_auth_oauthlib.flow import Flow
import secrets
from werkzeug.utils import secure_filename
import hashlib
from datetime import datetime

@app.route('/')
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
		flash(f"Please provide: {', '.join(missing)}.", 'error')
		return redirect(url_for('how_landlords'))

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

	flash('Thanks! Your property details were submitted. We will be in touch shortly.', 'success')
	return redirect(url_for('how_landlords'))

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

@app.route('/verify')
def verify():
	user_id = session.get('user_id')
	verification_status = None
	verification_docs = []
	
	if user_id:
		verification_status = get_user_verification_status(user_id)
		verification_docs = get_user_verification_documents(user_id)
	
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
def upload_verification_document(document_type):
	"""Handle file upload for verification documents."""
	if 'user_id' not in session:
		return jsonify({'success': False, 'message': 'Please login first'}), 401
	
	user_id = session['user_id']
	
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
def get_verification_status():
	"""Get current verification status for logged-in user."""
	if 'user_id' not in session:
		return jsonify({'success': False, 'message': 'Not logged in'}), 401
	
	user_id = session['user_id']
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
