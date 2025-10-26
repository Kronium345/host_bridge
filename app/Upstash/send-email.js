import dayjs from 'dayjs';
import { emailTemplates } from './email-template.js';
import transporter, { accountEmail } from '../config/nodemailer.js';

export const sendReminderEmail = async ({ to, type, subscription }) => {
    if (!to || !type) throw new Error('Missing the required parameters');

    const template = emailTemplates.find((t) => t.label === type);
    if (!template) throw new Error(`Template for type ${type} not found`);

    const mailInfo = {
        userName: subscription.user.name,
        subscriptionName: subscription.name,
        renewalDate: dayjs(subscription.renewalDate).format('DD/MM/YYYY'),
        planName: subscription.name,
        price: `${subscription.currency} ${subscription.price} (${subscription.frequency})`,
        paymentMethod: subscription.paymentMethod,
    };

    const message = template.generateBody(mailInfo);
    const subject = template.generateSubject(mailInfo);

    const mailOptions = {
        from: accountEmail,
        to: to,
        subject: subject,
        html: message,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.response);
    } catch (error) {
        console.error('❌ Email failed to send:', error.message);
        throw error;
    }
};

export const sendPaymentNotificationEmail = async ({ userName, userEmail, amount, currency, subscriptionPlan }) => {
    try {
        const template = emailTemplates.find((t) => t.label === 'payment_notification');
        if (!template) throw new Error('Payment notification template not found');

        const mailInfo = {
            userName,
            userEmail,
            amount,
            currency,
            subscriptionPlan,
            paymentDate: dayjs().format('DD/MM/YYYY HH:mm'),
        };

        const message = template.generateBody(mailInfo);
        const subject = template.generateSubject(mailInfo);

        // Send to both admin emails
        const adminEmails = ['pharmaque23@gmail.com', 'kronium345@gmail.com'];

        for (const adminEmail of adminEmails) {
            const mailOptions = {
                from: accountEmail,
                to: adminEmail,
                subject: subject,
                html: message,
            };

            try {
                const info = await transporter.sendMail(mailOptions);
                console.log(`✅ Payment notification email sent to ${adminEmail}:`, info.response);
            } catch (error) {
                console.error(`❌ Payment notification email failed to send to ${adminEmail}:`, error.message);
            }
        }
    } catch (error) {
        console.error('❌ Error sending payment notification email:', error.message);
    }
};
