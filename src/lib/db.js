import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Các URL cơ sở dữ liệu với các cổng CockroachDB khác nhau
function getDatabaseUrls() {
  const isDocker = process.env.IS_DOCKER === 'true' || process.env.NODE_ENV === 'docker';
  
  if (isDocker) {
    // Trong Docker, kết nối tới các container cockroach khác nhau
    return [
      process.env.DATABASE_URL || 'postgresql://root@cockroach1:26257/blog?sslmode=disable',
      'postgresql://root@cockroach2:26257/blog?sslmode=disable',
      'postgresql://root@cockroach3:26257/blog?sslmode=disable'
    ];
  } else {
    // Trong môi trường local, kết nối qua các cổng khác nhau
    return [
      process.env.DATABASE_URL_LOCAL || 'postgresql://root@localhost:26257/blog?sslmode=disable',
      'postgresql://root@localhost:26258/blog?sslmode=disable',
      'postgresql://root@localhost:26259/blog?sslmode=disable'
    ];
  }
}

// Thử kết nối tới tất cả các URL trong mảng cho đến khi một kết nối thành công
async function connectWithFailover() {
  const databaseUrls = getDatabaseUrls();
  let lastError = null;
  let connectedUrl = null;
  
  for (const url of databaseUrls) {
    try {
      const tempPool = new Pool({ connectionString: url });
      const client = await tempPool.connect();
      
      console.log('Connected to CockroachDB successfully');
      client.release();
      
      // Trả về URL kết nối thành công
      connectedUrl = url;
      return { pool: tempPool, url };
    } catch (err) {
      console.error(`Failed to connect to CockroachDB at ${url.replace(/\/\/.*@/, '//***@')}:`, err.message);
      lastError = err;
    }
  }
  
  // Nếu không có kết nối nào thành công, ném lỗi cuối cùng
  throw lastError || new Error('Could not connect to any CockroachDB instances');
}

// Khởi tạo pool ban đầu với URL đầu tiên để tránh lỗi khi import
const initialUrl = getDatabaseUrls()[0];
let pool = new Pool({ connectionString: initialUrl });
let databaseUrl = initialUrl;

// Khởi tạo kết nối với cơ chế failover
(async function initializePool() {
  try {
    const result = await connectWithFailover();
    // Đóng pool cũ nếu đã tạo một cái mới
    if (pool !== result.pool) {
      await pool.end();
      pool = result.pool;
    }
    databaseUrl = result.url;
    console.log('Using database URL:', databaseUrl.replace(/\/\/.*@/, '//***@'));
  } catch (err) {
    console.error('Could not connect to any CockroachDB instances:', err);
    // Giữ pool ban đầu
  }
})();

// Hàm query với khả năng thử kết nối lại
async function queryWithRetry(text, params, retries = 1) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (retries > 0 && (err.code === 'ECONNREFUSED' || err.code === 'EAI_AGAIN')) {
      console.log('Connection error, attempting to reconnect...');
      try {
        const result = await connectWithFailover();
        pool = result.pool;
        databaseUrl = result.url;
        console.log('Reconnected to database. Retrying query...');
        return queryWithRetry(text, params, retries - 1);
      } catch (reconnectErr) {
        console.error('Failed to reconnect:', reconnectErr);
        throw err;
      }
    } else {
      throw err;
    }
  }
}

// Hàm getClient với khả năng thử kết nối lại
async function getClientWithRetry(retries = 1) {
  try {
    return await pool.connect();
  } catch (err) {
    if (retries > 0 && (err.code === 'ECONNREFUSED' || err.code === 'EAI_AGAIN')) {
      console.log('Connection error, attempting to reconnect...');
      try {
        const result = await connectWithFailover();
        pool = result.pool;
        databaseUrl = result.url;
        console.log('Reconnected to database. Retrying get client...');
        return getClientWithRetry(retries - 1);
      } catch (reconnectErr) {
        console.error('Failed to reconnect:', reconnectErr);
        throw err;
      }
    } else {
      throw err;
    }
  }
}

// Export helpers
export const db = {
  query: queryWithRetry,
  getClient: getClientWithRetry
};

export default {
  query: queryWithRetry,
  getClient: getClientWithRetry
};

export { pool };
