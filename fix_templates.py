#!/usr/bin/env python3
"""
Fix remaining Jinja2 syntax in static HTML files
"""
import os
import re
from pathlib import Path

def fix_jinja_syntax(content):
    """Fix remaining {{ ./path }} syntax"""
    # Fix {{ ./path }} patterns
    content = re.sub(r'\{\{\s*\./([^}]+)\s*\}\}', r'./\1', content)
    
    # Fix any remaining {{ }} patterns with relative paths
    content = re.sub(r'\{\{\s*([^}]*\.(?:css|js|jpg|jpeg|png|gif|ico|svg|json))\s*\}\}', r'./\1', content)
    
    return content

def fix_file(file_path):
    """Fix a single HTML file"""
    print(f"Fixing {file_path.name}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Apply fixes
    content = fix_jinja_syntax(content)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Fixed {file_path.name}")

def main():
    static_html_dir = Path('static_html')
    
    if not static_html_dir.exists():
        print("❌ static_html directory not found!")
        return
    
    # Fix all HTML files
    for html_file in static_html_dir.glob('*.html'):
        try:
            fix_file(html_file)
        except Exception as e:
            print(f"✗ Error fixing {html_file.name}: {e}")
    
    print("\n✅ All files fixed!")
    print("\nNext steps:")
    print("1. Re-upload the fixed HTML files from static_html/ to Hostinger")
    print("2. Test your site - images and JS should now work!")

if __name__ == '__main__':
    main()
