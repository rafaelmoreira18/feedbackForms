import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'feedbackforms',
  password: process.env.DB_PASSWORD || 'feedbackforms_dev',
  database: process.env.DB_DATABASE || 'feedbackforms',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  ssl:
    process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
