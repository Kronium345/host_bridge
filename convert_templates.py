#!/usr/bin/env python3
"""
Convert Flask/Jinja2 templates to static HTML for Hostinger deployment
"""
import os
import re
from pathlib import Path

# Mapping of Jinja2 url_for() calls to static paths
URL_MAPPINGS = {
    "url_for('home')": "./index.html",
    "url_for('how_landlords')": "./how_landlords.html",
    "url_for('how_operators')": "./how_operators.html",
    "url_for('list_property')": "./list_property.html",
    "url_for('find_property')": "./find_property.html",
    "url_for('legality_map')": "./legality_map.html",
    "url_for('marketplace_listings')": "./marketplace_listings.html",
    "url_for('templates_resource')": "./templates_resource.html",
    "url_for('verify')": "./verify.html",
    "url_for('services')": "./services.html",
    "url_for('contact')": "./contact.html",
    "url_for('login')": "./login.html",
    "url_for('register')": "./register.html",
    "url_for('logout')": "./index.html",
    "url_for('forgotpassword')": "./forgotpassword.html",
    "url_for('privacy')": "./privacypolicy.html",
    "url_for('view_property', property_id=1)": "./property_details.html?id=1",
    "url_for('view_property', property_id=2)": "./property_details.html?id=2",
    "url_for('view_property', property_id=3)": "./property_details.html?id=3",
    "url_for('view_property', property_id=4)": "./property_details.html?id=4",
    "url_for('submit_property')": "https://host-bridge.onrender.com/submit_property",
    "url_for('login_google', next=url_for('home'))": "https://host-bridge.onrender.com/login/google",
}

def convert_static_url(match):
    """Convert url_for('static', filename='...') to relative path"""
    filename = match.group(1)
    return f"./{filename}"

def convert_url_for(content):
    """Convert all url_for() calls to static paths"""
    # First handle static files
    content = re.sub(r"url_for\('static',\s*filename='([^']+)'\)", convert_static_url, content)
    content = re.sub(r'url_for\("static",\s*filename="([^"]+)"\)', convert_static_url, content)
    
    # Then handle route URLs
    for jinja_url, static_url in URL_MAPPINGS.items():
        content = content.replace('{{ ' + jinja_url + ' }}', static_url)
        content = content.replace('"{{ ' + jinja_url + ' }}"', f'"{static_url}"')
        content = content.replace("'{{ " + jinja_url + " }}'", f"'{static_url}'")
    
    return content

def remove_jinja_blocks(content, template_name):
    """Remove Jinja2 template blocks and extends"""
    # Remove extends statement
    content = re.sub(r'{%\s*extends\s+["\']base\.html["\']\s*%}', '', content)
    
    # Extract content block
    content_match = re.search(r'{%\s*block\s+content\s*%}(.*?){%\s*endblock\s*%}', content, re.DOTALL)
    scripts_match = re.search(r'{%\s*block\s+scripts\s*%}(.*?){%\s*endblock\s*%}', content, re.DOTALL)
    
    main_content = content_match.group(1).strip() if content_match else content
    scripts_content = scripts_match.group(1).strip() if scripts_match else ""
    
    return main_content, scripts_content

def remove_jinja_conditionals(content):
    """Remove Jinja2 conditionals and keep non-auth version"""
    # Remove session checks - keep logged out version
    content = re.sub(
        r'{%\s*if\s+session\.get\(["\']user_id["\']\)\s*%}.*?{%\s*else\s*%}(.*?){%\s*endif\s*%}',
        r'\1',
        content,
        flags=re.DOTALL
    )
    
    # Remove any remaining if blocks (keep content)
    content = re.sub(r'{%\s*if\s+.*?%}', '', content)
    content = re.sub(r'{%\s*else\s*%}', '', content)
    content = re.sub(r'{%\s*endif\s*%}', '', content)
    content = re.sub(r'{%\s*endfor\s*%}', '', content)
    
    # Remove variable outputs that are session-related
    content = re.sub(r'{{\s*session\.get\([^}]+\)\s*}}', '', content)
    
    return content

def convert_emailjs_vars(content):
    """Convert EmailJS template variables to hardcoded values"""
    content = content.replace('{{ EMAILJS_SERVICE }}', 'service_jkqc0a3')
    content = content.replace('{{ EMAILJS_TEMPLATE }}', 'template_bcdin9c')
    content = content.replace('{{ EMAILJS_PUBLIC }}', 'Ii74HDqv0DgwxKC2u')
    return content

def create_full_html(main_content, scripts_content, base_content):
    """Create full HTML by injecting content into base template"""
    # Replace the main content block
    full_html = base_content.replace('<!-- Content will be inserted here -->', main_content)
    
    # Replace the scripts block
    full_html = full_html.replace('<!-- Scripts will be inserted here -->', scripts_content)
    
    return full_html

def convert_template(template_path, base_content, output_dir):
    """Convert a single template file"""
    print(f"Converting {template_path.name}...")
    
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip base.html
    if template_path.name == 'base.html':
        return
    
    # Extract content and scripts blocks
    main_content, scripts_content = remove_jinja_blocks(content, template_path.name)
    
    # Convert URLs
    main_content = convert_url_for(main_content)
    scripts_content = convert_url_for(scripts_content)
    
    # Remove Jinja conditionals
    main_content = remove_jinja_conditionals(main_content)
    
    # Convert EmailJS variables
    main_content = convert_emailjs_vars(main_content)
    scripts_content = convert_emailjs_vars(scripts_content)
    
    # Create full HTML
    full_html = create_full_html(main_content, scripts_content, base_content)
    
    # Write output
    output_path = output_dir / template_path.name
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(full_html)
    
    print(f"✓ Created {output_path.name}")

def main():
    # Paths
    templates_dir = Path('app/templates')
    output_dir = Path('static_html')
    output_dir.mkdir(exist_ok=True)
    
    # Read and convert base template
    print("Converting base template...")
    with open('static_base.html', 'r', encoding='utf-8') as f:
        base_content = f.read()
    
    # Convert all templates
    for template_path in templates_dir.glob('*.html'):
        if template_path.name != 'base.html':
            try:
                convert_template(template_path, base_content, output_dir)
            except Exception as e:
                print(f"✗ Error converting {template_path.name}: {e}")
    
    print(f"\n✓ Conversion complete! Files saved to {output_dir}/")
    print("\nNext steps:")
    print("1. Copy all files from static_html/ to Hostinger")
    print("2. Copy app/static/ folder contents (css/, js/, images/, data/) to Hostinger")
    print("3. Your Flask backend on Render will handle all API calls")

if __name__ == '__main__':
    main()

