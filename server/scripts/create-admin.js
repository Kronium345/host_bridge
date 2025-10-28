import bcrypt from 'bcrypt';
import { User, sequelize } from '../models/index.js';

/**
 * Create admin user script
 * Usage: node server/scripts/create-admin.js
 */
(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        const existing = await User.findOne({ where: { email: 'admin@hostbridge.com' } });
        if (existing) {
            console.log('⚠️  Admin user already exists');
            console.log(`   Email: admin@hostbridge.com`);
            process.exit(0);
        }

        const hashed = await bcrypt.hash('admin123', 10);

        await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@hostbridge.com',
            password: hashed,
            role: 'admin',
            emailVerified: true,
        });

        console.log('✅ Admin user created successfully!');
        console.log('');
        console.log('   Email: admin@hostbridge.com');
        console.log('   Password: admin123');
        console.log('');
        console.log('⚠️  IMPORTANT: Change this password immediately in production!');

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to create admin:', err);
        process.exit(1);
    }
})();

