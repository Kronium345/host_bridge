import transporter, { accountEmail } from '../config/nodemailer.js';
import {
    generateWelcomeEmailTemplate,
    generateLoginNotificationTemplate,
    generatePasswordResetTemplate,
    emailSubjects
} from './emailTemplates.js';
import dotenv from 'dotenv';

dotenv.config();

const senderEmail = accountEmail;

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(toEmail, userName, userRole) {
    try {
        console.log('🟢 DEBUG: Sending welcome email...');
        console.log(`   To: ${toEmail}`);
        console.log(`   Name: ${userName}`);
        console.log(`   Role: ${userRole}`);
        console.log(`   From: ${senderEmail}`);

        const htmlBody = generateWelcomeEmailTemplate({
            userName,
            userRole,
        });

        const subject = emailSubjects.welcome(userName, userRole);

        const mailOptions = {
            from: senderEmail,
            to: toEmail,
            subject: subject,
            html: htmlBody,
            replyTo: 'hostbridgee@gmail.com',
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent successfully!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send welcome email:', error);
        if (error.response) {
            console.error('   SMTP Error:', error.response);
        }
        return false;
    }
}

/**
 * Send login notification email
 */
export async function sendLoginNotificationEmail(toEmail, userName) {
    try {
        console.log('🔵 DEBUG: Sending login notification...');
        console.log(`   To: ${toEmail}`);
        console.log(`   Name: ${userName}`);

        const now = new Date();
        const loginDate = now.toLocaleString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const htmlBody = generateLoginNotificationTemplate({
            userName,
            loginDate,
        });

        const subject = emailSubjects.loginNotification(userName);

        const mailOptions = {
            from: senderEmail,
            to: toEmail,
            subject: subject,
            html: htmlBody,
            replyTo: 'hostbridgee@gmail.com',
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Login notification sent successfully!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send login notification:', error);
        if (error.response) {
            console.error('   SMTP Error:', error.response);
        }
        return false;
    }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(toEmail, userName, resetToken) {
    try {
        const resetUrl = `https://host-bridge.onrender.com/reset_password.html?token=${resetToken}`;

        const htmlBody = generatePasswordResetTemplate({
            userName,
            resetLink: resetUrl,
            expiryHours: 1,
        });

        const subject = emailSubjects.passwordReset(userName);

        const mailOptions = {
            from: senderEmail,
            to: toEmail,
            subject: subject,
            html: htmlBody,
            replyTo: 'hostbridgee@gmail.com',
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent successfully!');
        console.log(`   Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send password reset email:', error);
        return false;
    }
}

