import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
  }
);

export async function connectDb() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected via Sequelize');
  } catch (err) {
    console.error('❌ Unable to connect to PostgreSQL:', err);
    process.exit(1);
  }
}
