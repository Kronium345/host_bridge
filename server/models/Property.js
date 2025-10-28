export default (sequelize, DataTypes) => {
    const Property = sequelize.define('Property', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        ownerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'owner_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false
        },
        city: {
            type: DataTypes.STRING,
            allowNull: false
        },
        postcode: {
            type: DataTypes.STRING,
            allowNull: false
        },
        country: {
            type: DataTypes.STRING,
            defaultValue: 'UK'
        },
        propertyType: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'property_type'
        },
        bedrooms: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        bathrooms: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        maxGuests: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'max_guests'
        },
        pricePerNight: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            field: 'price_per_night'
        },
        amenities: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const value = this.getDataValue('amenities');
                return value ? JSON.parse(value) : [];
            },
            set(value) {
                this.setDataValue('amenities', JSON.stringify(value));
            }
        },
        images: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const value = this.getDataValue('images');
                return value ? JSON.parse(value) : [];
            },
            set(value) {
                this.setDataValue('images', JSON.stringify(value));
            }
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'updated_at'
        }
    }, {
        tableName: 'properties',
        timestamps: true,
        underscored: true
    });

    Property.associate = (models) => {
        // Property belongs to User (owner)
        Property.belongsTo(models.User, {
            foreignKey: 'ownerId',
            as: 'owner'
        });
    };

    return Property;
};

