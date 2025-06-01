import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Auto-detect environment and set appropriate database URL
function getDatabaseUrl() {
  // Check if we're running inside Docker
  const isDocker = process.env.IS_DOCKER === 'true' || process.env.NODE_ENV === 'docker';
  
  if (isDocker) {
    // Running inside Docker - use docker hostname
    return process.env.DATABASE_URL || 'postgresql://root@cockroach1:26257/blog?sslmode=disable';
  } else {
    // Running outside Docker - use localhost
    return process.env.DATABASE_URL_LOCAL || 'postgresql://root@localhost:26257/blog?sslmode=disable';
  }
}

// Tạo connection pool cho CockroachDB
const databaseUrl = getDatabaseUrl();
console.log('Using database URL:', databaseUrl.replace(/\/\/.*@/, '//***@')); // Hide credentials in log

const pool = new Pool({
  connectionString: databaseUrl
});

// Kiểm tra kết nối khi server khởi động
pool.connect()
  .then(() => console.log('Connected to CockroachDB successfully'))
  .catch(err => console.error('Failed to connect to CockroachDB:', err));

// Export pool as db for use in other modules
export const db = pool;

// Export default object for compatibility with existing code
export default {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
};

// Export pool separately for direct access
export { pool };
