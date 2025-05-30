import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Tạo connection pool cho CockroachDB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Kiểm tra kết nối khi server khởi động
pool.connect()
  .then(client => {
    console.log('Connected to CockroachDB successfully');
    client.release();
  })
  .catch(err => {
    console.error('Error connecting to CockroachDB:', err);
  });

export default {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
};
