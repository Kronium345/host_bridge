'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('properties', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            owner_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            address: {
                type: Sequelize.STRING,
                allowNull: false
            },
            city: {
                type: Sequelize.STRING,
                allowNull: false
            },
            postcode: {
                type: Sequelize.STRING,
                allowNull: false
            },
            country: {
                type: Sequelize.STRING,
                defaultValue: 'UK'
            },
            property_type: {
                type: Sequelize.STRING,
                allowNull: false
            },
            bedrooms: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            bathrooms: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            max_guests: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            price_per_night: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            amenities: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            images: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
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

        await queryInterface.addIndex('properties', ['owner_id']);
        await queryInterface.addIndex('properties', ['city']);
        await queryInterface.addIndex('properties', ['is_active']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('properties');
    }
};

