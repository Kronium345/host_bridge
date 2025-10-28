'use strict';
const bcrypt = require('bcrypt');

module.exports = {
    async up(queryInterface, Sequelize) {
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await queryInterface.bulkInsert('users', [{
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@hostbridge.com',
            password: hashedPassword,
            role: 'admin',
            email_verified: true,
            phone_number: null,
            verification_token: null,
            reset_token: null,
            reset_token_expires: null,
            created_at: new Date(),
            updated_at: new Date()
        }], { ignoreDuplicates: true });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('users', {
            email: 'admin@hostbridge.com'
        });
    }
};

