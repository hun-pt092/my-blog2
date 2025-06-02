// Netlify serverless function để xử lý các request API
const { Pool } = require('pg');

// Khởi tạo kết nối database
let pool;

function getDbConnection() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

exports.handler = async function(event, context) {
  // Phân tích path để định tuyến request
  const path = event.path.replace('/.netlify/functions/api', '');
  const segments = path.split('/').filter(Boolean);
  
  // Phân tích HTTP method
  const httpMethod = event.httpMethod;

  // Xử lý CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // Preflight request
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  try {
    // Routing logic
    if (segments[0] === 'posts') {
      return await handlePostsRoute(segments.slice(1), httpMethod, event, headers);
    } else if (segments[0] === 'comments') {
      return await handleCommentsRoute(segments.slice(1), httpMethod, event, headers);
    } else if (segments[0] === 'health') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'ok', environment: process.env.NODE_ENV })
      };
    }

    // Route không tồn tại
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not Found' })
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};

// Xử lý routes cho bài viết
async function handlePostsRoute(segments, method, event, headers) {
  const db = getDbConnection();
  
  // GET /posts - Lấy danh sách bài viết
  if (segments.length === 0 && method === 'GET') {
    const result = await db.query('SELECT * FROM posts ORDER BY date DESC');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.rows)
    };
  }
  
  // GET /posts/:slug - Lấy một bài viết theo slug
  if (segments.length === 1 && method === 'GET') {
    const slug = segments[0];
    const result = await db.query('SELECT * FROM posts WHERE slug = $1', [slug]);
    
    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Post not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.rows[0])
    };
  }
  
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Not Found' })
  };
}

// Xử lý routes cho comments
async function handleCommentsRoute(segments, method, event, headers) {
  const db = getDbConnection();
  
  // GET /comments/:postId - Lấy comments cho bài viết
  if (segments.length === 1 && method === 'GET') {
    const postId = segments[0];
    const result = await db.query(
      'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at DESC',
      [postId]
    );
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.rows)
    };
  }
  
  // POST /comments - Tạo comment mới
  if (segments.length === 0 && method === 'POST') {
    try {
      const { post_id, author, content } = JSON.parse(event.body);
      
      if (!post_id || !content) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }
      
      const result = await db.query(
        'INSERT INTO comments (post_id, author, content) VALUES ($1, $2, $3) RETURNING *',
        [post_id, author || 'Anonymous', content]
      );
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request' })
      };
    }
  }
  
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Not Found' })
  };
}
