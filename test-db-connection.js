require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'nestjs_db',
  logging: console.log,
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection successful!');
    console.log(`Connected to: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`);
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. PostgreSQL is running');
    console.log('2. Database exists: ' + (process.env.DB_DATABASE || 'nestjs_db'));
    console.log('3. Credentials are correct in .env file');
    process.exit(1);
  }
}

testConnection();
