import bcrypt from 'bcrypt';
import { sequelize, User } from './models/index.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Ensure default admin user exists
 */
const ensureAdminExists = async () => {
    try {
        const admin = await User.findOne({ where: { role: 'admin' } });

        if (!admin) {
            console.log('📝 Creating default admin user...');
            const hashedPassword = await bcrypt.hash('admin123', 10);

            await User.create({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@hostbridge.com',
                password: hashedPassword,
                role: 'admin',
                emailVerified: true
            });

            console.log('✅ Default admin created:');
            console.log('   Email: admin@hostbridge.com');
            console.log('   Password: admin123');
            console.log('   ⚠️  Please change this password in production!');
        } else {
            console.log('✅ Admin user already exists');
        }
    } catch (error) {
        console.error('❌ Failed to create admin:', error);
        throw error;
    }
};

/**
 * Main sync function
 */
const syncDatabase = async () => {
    try {
        console.log('╔════════════════════════════════════════╗');
        console.log('║   Host Bridge - Database Setup         ║');
        console.log('╚════════════════════════════════════════╝\n');

        // Test connection
        console.log('🔌 Testing database connection...');
        await sequelize.authenticate();
        console.log('✅ Database connected successfully\n');

        // Sync models
        console.log('🔄 Synchronizing database models...');
        await sequelize.sync({ force: true }); // WARNING: This drops all tables!
        console.log('✅ Database models synchronized\n');

        // Create admin
        console.log('👤 Setting up admin user...');
        await ensureAdminExists();
        console.log('');

        console.log('╔════════════════════════════════════════╗');
        console.log('║   ✅ Database setup complete!          ║');
        console.log('╚════════════════════════════════════════╝\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Database setup failed:', error);
        process.exit(1);
    }
};

syncDatabase();

