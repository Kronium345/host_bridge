import dayjs from 'dayjs';
import { User } from '../models/User.js';
import { sendReminderEmail } from '../utils/send-email.js';
import { CQuiz } from '../models/ChaptersQuiz.js';
import { FQuiz } from '../models/FlashQuiz.js';

// 👇 This is used because @upstash/workflow uses CommonJS (ES5),
// so we dynamically require it inside an ES module (your project is likely ES6-based)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { serve } = require('@upstash/workflow/express');

// Define how many days in advance to send reminders
const REMINDER_DAYS_BEFORE = 3;

// 🔁 This wraps your workflow logic so it can be run when triggered via QStash
export const sendReminders = serve(async (context) => {
    const { userId } = context.requestPayload;

    // 🔍 Step 1: Get the user by ID from MongoDB
    const user = await fetchUser(context, userId);
    if (!user) return;

    // Step 1b: Check for incomplete quizzes and flashcards
    const incompleteQuizzes = await CQuiz.countDocuments({ user: user._id, $expr: { $lt: ["$attemptedQuestions", "$totalQuestions"] } });
    const incompleteFlashcards = await FQuiz.countDocuments({ user: user._id, $expr: { $lt: ["$attemptedQuestions", "$totalQuestions"] } });
    if (incompleteQuizzes > 0 || incompleteFlashcards > 0) {
        await sendReminderEmail({
            to: user.email,
            type: 'Quiz/Flashcard reminder',
            subscription: {
                user: { name: user.username, email: user.email },
                incompleteQuizzes,
                incompleteFlashcards,
                dashboardLink: 'https://www.pharmaque.co.uk/dashboard',
            }
        });
    }

    // Step 2: Get the user's subscription plan
    const subscriptionPlan = user.subscriptionPlan;
    if (!subscriptionPlan) return;

    // Step 3: Calculate the renewal date based on the plan
    // We'll use the user's _id generation time as a fallback for subscription start
    // (ObjectId's timestamp is the creation time)
    let startDate = dayjs(parseInt(user._id.toString().substring(0, 8), 16) * 1000);
    let renewalDate;
    if (subscriptionPlan === 'threeMonths') {
        renewalDate = startDate.add(3, 'month');
    } else if (subscriptionPlan === 'nineMonths') {
        renewalDate = startDate.add(9, 'month');
    } else {
        renewalDate = null; // Free plan or unknown
    }

    // 🛑 If the renewal date has already passed, stop the workflow
    if (renewalDate && renewalDate.isBefore(dayjs())) {
        console.log(
            `Renewal date has passed for user ${userId}. Halting workflow.`
        );
        return;
    }

    // For paid plans, send a reminder REMINDER_DAYS_BEFORE days before renewal
    if (renewalDate && dayjs().isSame(renewalDate.subtract(REMINDER_DAYS_BEFORE, 'day'), 'day')) {
        await triggerReminder(context, `Renewal reminder`, user, renewalDate);
    }

    // For Free plan, send periodic upgrade nudges (e.g., every 30 days since start)
    if (subscriptionPlan === 'Free') {
        const daysSinceStart = dayjs().diff(startDate, 'day');
        if (daysSinceStart % 30 === 0) {
            await triggerReminder(context, `Upgrade reminder`, user, null);
        }
    }
});

// 🔍 Helper to fetch the user and populate details
const fetchUser = async (context, userId) => {
    return await context.run('Get user', async () => {
        return User.findById(userId);
    });
};

// 💤 Helper to delay execution until a specific date/time
const sleepUntilReminder = async (context, label, date) => {
    console.log(`Sleeping until ${label} reminder at ${date}`);
    await context.sleepUntil(label, date.toDate());
};

// 📤 Send the reminder based on the user's subscription plan
const triggerReminder = async (context, label, user, renewalDate) => {
    return await context.run(label, async () => {
        console.log(`📧 Sending ${label}`);
        let subscription = {
            user: { name: user.username, email: user.email },
            name: user.subscriptionPlan,
            renewalDate: renewalDate ? renewalDate.toDate() : undefined,
            price: user.subscriptionPlan === 'threeMonths' ? '£35' : user.subscriptionPlan === 'nineMonths' ? '£80' : '£0',
            currency: 'GBP',
            frequency: user.subscriptionPlan === 'threeMonths' ? '3 months' : user.subscriptionPlan === 'nineMonths' ? '9 months' : 'N/A',
            paymentMethod: user.subscriptionPlan === 'Free' ? 'None' : 'Card',
        };
        await sendReminderEmail({
            to: user.email,
            type: label,
            subscription,
        });
        console.log('✅ Email send triggered');
    });
};
