from app import app
from flask import render_template, request, redirect, url_for, session, flash
from app.db import verify_credentials, create_user, find_user_by_email

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

@app.route('/login', methods=['GET', 'POST'])
def login():
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
    # For now, just render the same find_property.html — implement filtering later
    return render_template('find_property.html')

