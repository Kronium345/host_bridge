"""
Alternative email service using SendGrid (or similar SMTP-based service).
This is a more reliable option than EmailJS for transactional emails.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional


def send_email_smtp(to: str, subject: str, html_body: str, smtp_server: str = None, port: int = 587) -> bool:
    """
    Send email using SMTP (SendGrid, Gmail, or other SMTP providers).
    
    Args:
        to: Recipient email address
        subject: Email subject line
        html_body: HTML formatted email body
        smtp_server: SMTP server (defaults to SendGrid)
        port: SMTP port
        
    Returns:
        bool: True if email sent successfully
    """
    try:
        # Get email credentials from environment
        smtp_host = smtp_server or os.getenv('SMTP_HOST', 'smtp.sendgrid.net')
        smtp_port = port or int(os.getenv('SMTP_PORT', '587'))
        smtp_user = os.getenv('SMTP_USER', 'apikey')  # For SendGrid, this is always 'apikey'
        smtp_password = os.getenv('SMTP_PASSWORD', '')
        sender_email = os.getenv('SENDER_EMAIL', 'noreply@host-bridge.com')
        
        if not smtp_password:
            print("⚠️ SMTP credentials not configured - User can still register but won't receive email")
            # Don't fail registration just because email fails
            return False
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = sender_email
        msg['To'] = to
        
        # Attach HTML body
        html_part = MIMEText(html_body, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        print(f"✅ Email sent to {to} via SMTP")
        return True
        
    except Exception as e:
        print(f"❌ Error sending email via SMTP: {str(e)}")
        return False


# Import the existing template functions
from app.email_service import (
    generate_welcome_email_template,
    generate_login_notification_template
)


def send_welcome_email(user_email: str, user_name: str, role: str) -> bool:
    """Send welcome email using SMTP"""
    subject = f"Welcome to HostBridge - {role.capitalize()} Account Created"
    html_body = generate_welcome_email_template(user_name, role)
    return send_email_smtp(user_email, subject, html_body)


def send_login_notification_email(user_email: str, user_name: str) -> bool:
    """Send login notification email using SMTP"""
    login_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    subject = "HostBridge - Login Notification"
    html_body = generate_login_notification_template(user_name, login_time)
    return send_email_smtp(user_email, subject, html_body)

