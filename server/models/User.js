export default (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'first_name'
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'last_name'
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.STRING,
            defaultValue: 'user',
            validate: {
                isIn: [['user', 'landlord', 'operator', 'admin']]
            }
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'phone_number'
        },
        emailVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'email_verified'
        },
        verificationToken: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'verification_token'
        },
        resetToken: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'reset_token'
        },
        resetTokenExpires: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'reset_token_expires'
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
        tableName: 'users',
        timestamps: true,
        underscored: true
    });

    User.associate = (models) => {
        // User has many Properties (as owner)
        User.hasMany(models.Property, {
            foreignKey: 'ownerId',
            as: 'properties'
        });
    };

    return User;
};

