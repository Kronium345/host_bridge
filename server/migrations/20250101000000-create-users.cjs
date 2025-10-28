'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('users', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            first_name: {
                type: Sequelize.STRING,
                allowNull: true
            },
            last_name: {
                type: Sequelize.STRING,
                allowNull: true
            },
            email: {
                type: Sequelize.STRING,
                unique: true,
                allowNull: false
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false
            },
            role: {
                type: Sequelize.STRING,
                defaultValue: 'user'
            },
            phone_number: {
                type: Sequelize.STRING,
                allowNull: true
            },
            email_verified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            verification_token: {
                type: Sequelize.STRING,
                allowNull: true
            },
            reset_token: {
                type: Sequelize.STRING,
                allowNull: true
            },
            reset_token_expires: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });

        await queryInterface.addIndex('users', ['email']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('users');
    }
};

