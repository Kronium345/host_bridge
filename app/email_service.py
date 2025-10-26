import os
import requests
from typing import Optional, Dict
from datetime import datetime


def send_email(to: str, subject: str, html_body: str) -> bool:
    """
    Send email using EmailJS via HTTP API.
    
    Args:
        to: Recipient email address
        subject: Email subject line
        html_body: HTML formatted email body
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # EmailJS configuration
        service_id = os.getenv('EMAILJS_SERVICE_ID', '')
        template_id = os.getenv('EMAILJS_TEMPLATE_ID', '')
        public_key = os.getenv('EMAILJS_PUBLIC_KEY', '')
        
        if not all([service_id, template_id, public_key]):
            print("⚠️ EmailJS credentials not configured")
            return False
        
        # EmailJS REST API endpoint
        url = f"https://api.emailjs.com/api/v1.0/email/send"
        
        payload = {
            "service_id": service_id,
            "template_id": template_id,
            "user_id": public_key,
            "template_params": {
                "to_email": to,
                "subject": subject,
                "message": html_body
            }
        }
        
        response = requests.post(url, json=payload, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ Email sent to {to}")
            return True
        else:
            print(f"❌ Failed to send email: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error sending email: {str(e)}")
        return False


def generate_welcome_email_template(user_name: str, role: str) -> str:
    """
    Generate welcome email HTML template for new users.
    
    Args:
        user_name: User's first name or email
        role: User's role ('landlord' or 'operator')
        
    Returns:
        str: HTML formatted email
    """
    role_name = "Landlord" if role == "landlord" else "Operator"
    welcome_message = f"Start listing your property and connect with operators" if role == "landlord" else f"Find compliant properties and start your business"
    
    return f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f4f7fa;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <tr>
                <td style="background-color: #004c46; text-align: center; padding: 30px;">
                    <h1 style="font-size: 32px; line-height: 36px; font-weight: 800; color: white; margin: 0;">HostBridge</h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px 30px;">                
                    <p style="font-size: 18px; margin-bottom: 25px;">Welcome to HostBridge, <strong style="color: #004c46;">{user_name}</strong>!</p>
                    
                    <p style="font-size: 16px; margin-bottom: 25px;">We're thrilled to have you join our community as a <strong>{role_name}</strong>.</p>
                    
                    <div style="background-color: #eaf5f2; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                        <p style="font-size: 16px; margin: 0 0 15px 0;"><strong>What's Next?</strong></p>
                        <p style="font-size: 16px; margin: 0;">{welcome_message}</p>
                    </div>
                    
                    <table cellpadding="15" cellspacing="0" border="0" width="100%" style="background-color: #f0faf6; border-radius: 10px; margin-bottom: 25px;">
                        <tr>
                            <td style="font-size: 16px; border-bottom: 1px solid #d0e8e4;">
                                <strong>Your Account Type:</strong> {role_name}
                            </td>
                        </tr>
                        <tr>
                            <td style="font-size: 16px;">
                                <strong>Email:</strong> [Your Email Address]
                            </td>
                        </tr>
                    </table>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://host-bridge.onrender.com" style="display: inline-block; padding: 14px 30px; background-color: #004c46; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Get Started</a>
                    </div>
                    
                    <p style="font-size: 16px; margin-top: 30px;">Need help? <a href="https://host-bridge.onrender.com/contact" style="color: #004c46; text-decoration: none;">Contact our support team</a> anytime.</p>
                    
                    <p style="font-size: 16px; margin-top: 30px;">
                        Best regards,<br>
                        <strong>The HostBridge Team</strong>
                    </p>
                </td>
            </tr>
            <tr>
                <td style="background-color: #f0faf6; padding: 20px; text-align: center; font-size: 14px;">
                    <p style="margin: 0 0 10px;">
                        HostBridge | Connecting Landlords with STR Operators
                    </p>
                    <p style="margin: 0;">
                        <a href="#" style="color: #004c46; text-decoration: none; margin: 0 10px;">Privacy Policy</a> | 
                        <a href="#" style="color: #004c46; text-decoration: none; margin: 0 10px;">Terms of Service</a>
                    </p>
                </td>
            </tr>
        </table>
    </div>
    """


def generate_login_notification_template(user_name: str, login_time: str, ip_address: Optional[str] = None) -> str:
    """
    Generate login notification email HTML template.
    
    Args:
        user_name: User's first name or email
        login_time: Timestamp of login
        ip_address: IP address (optional)
        
    Returns:
        str: HTML formatted email
    """
    return f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f4f7fa;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <tr>
                <td style="background-color: #004c46; text-align: center; padding: 30px;">
                    <h1 style="font-size: 32px; line-height: 36px; font-weight: 800; color: white; margin: 0;">HostBridge</h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px 30px;">                
                    <p style="font-size: 18px; margin-bottom: 25px;">Hello <strong style="color: #004c46;">{user_name}</strong>,</p>
                    
                    <p style="font-size: 16px; margin-bottom: 25px;">You've successfully logged into your HostBridge account.</p>
                    
                    <table cellpadding="15" cellspacing="0" border="0" width="100%" style="background-color: #f0faf6; border-radius: 10px; margin-bottom: 25px;">
                        <tr>
                            <td style="font-size: 16px; border-bottom: 1px solid #d0e8e4;">
                                <strong>Login Time:</strong> {login_time}
                            </td>
                        </tr>
                    </table>
                    
                    <p style="font-size: 16px; margin-bottom: 25px;">If this wasn't you, please <a href="https://host-bridge.onrender.com/login.html?action=reset" style="color: #004c46; text-decoration: none;">reset your password</a> immediately.</p>
                    
                    <p style="font-size: 16px; margin-top: 30px;">
                        Best regards,<br>
                        <strong>The HostBridge Team</strong>
                    </p>
                </td>
            </tr>
        </table>
    </div>
    """


def send_welcome_email(user_email: str, user_name: str, role: str) -> bool:
    """
    Send welcome email to newly registered users.
    
    Args:
        user_email: User's email address
        user_name: User's first name or email
        role: User's role ('landlord' or 'operator')
        
    Returns:
        bool: True if email sent successfully
    """
    subject = f"Welcome to HostBridge - {role.capitalize()} Account Created"
    html_body = generate_welcome_email_template(user_name, role)
    return send_email(user_email, subject, html_body)


def send_login_notification_email(user_email: str, user_name: str) -> bool:
    """
    Send login notification email to users when they sign in.
    
    Args:
        user_email: User's email address
        user_name: User's first name or email
        
    Returns:
        bool: True if email sent successfully
    """
    login_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    subject = "HostBridge - Login Notification"
    html_body = generate_login_notification_template(user_name, login_time)
    return send_email(user_email, subject, html_body)
