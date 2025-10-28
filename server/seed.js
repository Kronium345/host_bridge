import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import User from './models/User.mongoose.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('✅ Admin user already exists:', existingAdmin.email);
            process.exit(0);
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@hostbridge.com',
            password: hashedPassword,
            role: 'admin',
            emailVerified: true
        });

        console.log('✅ Admin user created successfully:');
        console.log('   Email: admin@hostbridge.com');
        console.log('   Password: admin123');
        console.log('   🔒 Please change the password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedAdmin();

