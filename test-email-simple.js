import dotenv from 'dotenv';
import { sendWelcomeEmail, sendLoginNotificationEmail } from './server/services/emailService.js';

dotenv.config();

console.log('🧪 Testing Email Service...\n');
console.log('Environment:');
console.log('  GMAIL_EMAIL:', process.env.GMAIL_EMAIL);
console.log('  GMAIL_PASSWORD:', process.env.GMAIL_PASSWORD ? '***hidden***' : 'NOT SET');
console.log('  SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com');
console.log('  SMTP_PORT:', process.env.SMTP_PORT || '587');
console.log('\n');

async function testEmails() {
    try {
        console.log('📧 Testing Welcome Email (Landlord)...');
        await sendWelcomeEmail('awolowodaniel@yahoo.ie', 'Test User', 'landlord');

        console.log('\n📧 Testing Login Notification...');
        await sendLoginNotificationEmail('awolowodaniel@yahoo.ie', 'Test User');

        console.log('\n✅ Email test complete! Check your inbox.');
    } catch (error) {
        console.error('\n❌ Email test failed:', error);
    }

    process.exit(0);
}

testEmails();

