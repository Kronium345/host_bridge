import { Sequelize, DataTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import UserDefinition from './User.js';
import PropertyDefinition from './Property.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const env = process.env.NODE_ENV || 'development';
const dbPath = env === 'production'
    ? './database/hostbridge.db'
    : join(__dirname, '../../database/hostbridge.db');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: env === 'development' ? console.log : false
});

// Initialize models
const User = UserDefinition(sequelize, DataTypes);
const Property = PropertyDefinition(sequelize, DataTypes);

const db = {
    sequelize,
    Sequelize,
    User,
    Property
};

// Set up associations
Object.values(db).forEach(model => {
    if (model && typeof model.associate === 'function') {
        model.associate(db);
    }
});

export { sequelize, Sequelize, User, Property };
export default db;

