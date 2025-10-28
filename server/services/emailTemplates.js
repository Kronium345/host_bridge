/**
 * Email Templates for Host Bridge
 */

export const generateWelcomeEmailTemplate = ({
  userName,
  userRole,
  dashboardLink = 'https://host-bridge.onrender.com/index.html',
}) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f4f7fa;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center; padding: 30px;">
        <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to Host Bridge!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #667eea; margin-top: 0;">Hi ${userName}! 👋</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          Thank you for registering as a <strong>${userRole === 'landlord' ? 'Landlord' : userRole === 'operator' ? 'Operator' : 'Member'}</strong> with Host Bridge. 
          We're excited to have you on board!
        </p>
        
        <div style="background-color: #f0f7ff; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #667eea;">Your account is ready! Here's what you can do:</h3>
          <ul style="padding-left: 20px; margin-bottom: 0;">
            ${userRole === 'landlord' ? `
            <li>List your properties on our platform</li>
            <li>Manage bookings and availability</li>
            <li>Track your earnings and analytics</li>
            <li>Connect with professional operators</li>
            ` : ''}
            ${userRole === 'operator' ? `
            <li>Browse available properties</li>
            <li>Manage property operations</li>
            <li>View detailed analytics</li>
            <li>Connect with property owners</li>
            ` : ''}
            ${userRole !== 'landlord' && userRole !== 'operator' ? `
            <li>Browse amazing properties</li>
            <li>Make and manage bookings</li>
            <li>Save your favorite listings</li>
            <li>Update your profile anytime</li>
            ` : ''}
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardLink}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Get Started →
          </a>
        </div>
        
        <p style="font-size: 16px; margin-top: 30px; color: #666;">
          If you have any questions or need assistance, don't hesitate to contact our support team.
        </p>
        
        <p style="font-size: 16px; margin-top: 30px;">
          Best regards,<br>
          <strong style="color: #667eea;">The Host Bridge Team</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f0f7ff; padding: 20px; text-align: center; font-size: 14px; color: #666;">
        <p style="margin: 0;">© 2025 Host Bridge. All rights reserved.</p>
        <p style="margin: 10px 0 0;">
          <a href="https://host-bridge.onrender.com/privacypolicy.html" style="color: #667eea; text-decoration: none; margin: 0 10px;">Privacy Policy</a> | 
          <a href="https://host-bridge.onrender.com/services.html" style="color: #667eea; text-decoration: none; margin: 0 10px;">Terms of Service</a>
        </p>
      </td>
    </tr>
  </table>
</div>
`;

export const generateLoginNotificationTemplate = ({
  userName,
  loginDate,
  ipAddress = 'Secure connection',
}) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f4f7fa;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center; padding: 20px;">
        <h2 style="color: white; margin: 0;">🔐 Account Login Notification</h2>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #667eea; margin-top: 0;">Hi ${userName},</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          We noticed a new login to your Host Bridge account.
        </p>
        
        <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; padding: 20px; margin: 25px 0; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #333;">Login Details:</h3>
          <p style="margin: 10px 0;"><strong>Time:</strong> ${loginDate}</p>
          <p style="margin: 10px 0;"><strong>Status:</strong> ${ipAddress}</p>
        </div>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 5px;">
          <p style="margin: 0 0 10px 0;"><strong>⚠️ Was this you?</strong></p>
          <p style="margin: 0;">
            If you recognize this login, you can safely ignore this email.
          </p>
          <p style="margin: 10px 0 0 0;">
            If you <strong>did not</strong> log in, please secure your account immediately by resetting your password.
          </p>
        </div>
        
        <p style="font-size: 16px; margin-top: 30px;">
          Best regards,<br>
          <strong style="color: #667eea;">The Host Bridge Security Team</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f0f7ff; padding: 20px; text-align: center; font-size: 14px; color: #666;">
        <p style="margin: 0;">© 2025 Host Bridge. All rights reserved.</p>
      </td>
    </tr>
  </table>
</div>
`;

export const generatePasswordResetTemplate = ({
  userName,
  resetLink,
  expiryHours = 1,
}) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f4f7fa;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center; padding: 20px;">
        <h2 style="color: white; margin: 0;">🔑 Password Reset Request</h2>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #667eea; margin-top: 0;">Hi ${userName},</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          We received a request to reset your password for your Host Bridge account.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Reset Your Password →
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          Or copy and paste this link:<br>
          <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
        </p>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 5px;">
          <p style="margin: 0;"><strong>⏰ This link will expire in ${expiryHours} hour(s).</strong></p>
        </div>
        
        <p style="font-size: 16px; margin-top: 30px; color: #666;">
          If you didn't request this, please ignore this email and your password will remain unchanged.
        </p>
        
        <p style="font-size: 16px; margin-top: 30px;">
          Best regards,<br>
          <strong style="color: #667eea;">The Host Bridge Team</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f0f7ff; padding: 20px; text-align: center; font-size: 14px; color: #666;">
        <p style="margin: 0;">© 2025 Host Bridge. All rights reserved.</p>
      </td>
    </tr>
  </table>
</div>
`;

export const emailSubjects = {
  welcome: (userName, userRole) => `Welcome to Host Bridge, ${userName}!`,
  loginNotification: (userName) => `New Login to Your Host Bridge Account`,
  passwordReset: (userName) => `Password Reset Request - Host Bridge`,
};

