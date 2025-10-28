import dotenv from 'dotenv';
import { sendWelcomeEmail, sendLoginNotificationEmail } from './server/services/emailService.js';
import { sequelize, User } from './server/models/index.js';

dotenv.config();

async function testEmailWithRoles() {
    try {
        console.log('🔄 Testing Host Bridge Email System...');
        console.log('📊 Environment Check:');
        console.log('- GMAIL_EMAIL:', process.env.GMAIL_EMAIL ? '✅ Set' : '❌ Missing');
        console.log('- GMAIL_PASSWORD:', process.env.GMAIL_PASSWORD ? '✅ Set' : '❌ Missing');
        console.log('- SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com');
        console.log('- SMTP_PORT:', process.env.SMTP_PORT || '587');

        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        const testEmail = 'kronium345@gmail.com';

        console.log('═══════════════════════════════════════════════');
        console.log('📧 TEST 1: Welcome Email for LANDLORD');
        console.log('═══════════════════════════════════════════════');
        console.log('To:', testEmail);
        console.log('Role: Landlord');
        console.log('');

        const landlordResult = await sendWelcomeEmail(testEmail, 'Test Landlord', 'landlord');

        if (landlordResult) {
            console.log('✅ Landlord welcome email sent successfully!');
            console.log('📬 Check inbox - should say "Thank you for registering as a Landlord"\n');
        } else {
            console.log('❌ Failed to send landlord email\n');
        }

        // Wait 3 seconds between emails
        console.log('⏳ Waiting 3 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('═══════════════════════════════════════════════');
        console.log('📧 TEST 2: Welcome Email for OPERATOR');
        console.log('═══════════════════════════════════════════════');
        console.log('To:', testEmail);
        console.log('Role: Operator');
        console.log('');

        const operatorResult = await sendWelcomeEmail(testEmail, 'Test Operator', 'operator');

        if (operatorResult) {
            console.log('✅ Operator welcome email sent successfully!');
            console.log('📬 Check inbox - should say "Thank you for registering as an Operator"\n');
        } else {
            console.log('❌ Failed to send operator email\n');
        }

        // Wait 3 seconds between emails
        console.log('⏳ Waiting 3 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('═══════════════════════════════════════════════');
        console.log('📧 TEST 3: Welcome Email for MEMBER (default)');
        console.log('═══════════════════════════════════════════════');
        console.log('To:', testEmail);
        console.log('Role: user (will show as "Member")');
        console.log('');

        const memberResult = await sendWelcomeEmail(testEmail, 'Test Member', 'user');

        if (memberResult) {
            console.log('✅ Member welcome email sent successfully!');
            console.log('📬 Check inbox - should say "Thank you for registering as a Member"\n');
        } else {
            console.log('❌ Failed to send member email\n');
        }

        // Wait 3 seconds
        console.log('⏳ Waiting 3 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('═══════════════════════════════════════════════');
        console.log('📧 TEST 4: Login Notification Email');
        console.log('═══════════════════════════════════════════════');
        console.log('To:', testEmail);
        console.log('');

        const loginResult = await sendLoginNotificationEmail(testEmail, 'Test User');

        if (loginResult) {
            console.log('✅ Login notification sent successfully!');
            console.log('📬 Check inbox for login notification\n');
        } else {
            console.log('❌ Failed to send login notification\n');
        }

        console.log('═══════════════════════════════════════════════');
        console.log('✅ ALL TESTS COMPLETE!');
        console.log('═══════════════════════════════════════════════');
        console.log('');
        console.log('📬 You should receive 4 emails at:', testEmail);
        console.log('   1. Welcome as Landlord');
        console.log('   2. Welcome as Operator');
        console.log('   3. Welcome as Member');
        console.log('   4. Login Notification');
        console.log('');
        console.log('⏰ Emails might take 1-2 minutes to arrive');
        console.log('');
        console.log('Expected text in emails:');
        console.log('  - Landlord: "Thank you for registering as a Landlord"');
        console.log('  - Operator: "Thank you for registering as an Operator"');
        console.log('  - Member: "Thank you for registering as a Member"');
        console.log('');

    } catch (error) {
        console.error('❌ Error testing email workflow:', error);
        console.error('Error details:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

// Run the test
console.log('');
console.log('╔════════════════════════════════════════════════╗');
console.log('║   Host Bridge Email Testing Suite             ║');
console.log('║   Testing Role-Based Welcome Emails           ║');
console.log('╚════════════════════════════════════════════════╝');
console.log('');

testEmailWithRoles();

