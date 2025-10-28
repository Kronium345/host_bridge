import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email account configuration - Use Gmail credentials from .env
export const accountEmail = process.env.GMAIL_EMAIL || process.env.EMAIL_USER || 'awolowodaniel@yahoo.ie';

// Create nodemailer transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.GMAIL_EMAIL || process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.GMAIL_PASSWORD || process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify transporter configuration
transporter.verify(function (error, success) {
    if (error) {
        console.log('❌ SMTP Server Error:', error);
        console.log('⚠️  Email service not available - check SMTP credentials');
    } else {
        console.log('✅ SMTP Server is ready to send emails');
    }
});

export default transporter;

