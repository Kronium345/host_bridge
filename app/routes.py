from app import app
from flask import render_template

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
    return render_template('login.html')

@app.route('/forgotpassword')
def forgotpassword():
    return render_template('forgotpassword.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    return render_template('register.html')


@app.route('/filter-properties', methods=['POST'])
def filter_properties():
    # For now, just render the same find_property.html — implement filtering later
    return render_template('find_property.html')

