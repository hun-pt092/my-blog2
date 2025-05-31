// Test database schema and fix comments table
import { pool } from './src/lib/db.js';

async function checkAndFixDatabase() {
    try {
        console.log('Checking database schema...');
        
        // Check comments table structure
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'comments'
            ORDER BY ordinal_position
        `);
        
        console.log('Comments table structure:');
        result.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // Check if user_id column exists
        const hasUserId = result.rows.some(row => row.column_name === 'user_id');
        
        if (!hasUserId) {
            console.log('❌ user_id column missing, adding it...');
            await pool.query('ALTER TABLE comments ADD COLUMN user_id UUID REFERENCES users(id)');
            console.log('✅ Added user_id column');
        } else {
            console.log('✅ user_id column exists');
        }
        
        // Check if users table exists
        const usersResult = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        
        if (usersResult.rows.length === 0) {
            console.log('❌ Users table not found, creating it...');
            await pool.query(`
                CREATE TABLE users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    display_name VARCHAR(100),
                    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
                    avatar_url VARCHAR(500),
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    is_active BOOLEAN DEFAULT true
                )
            `);
            console.log('✅ Users table created');
        } else {
            console.log('✅ Users table exists');
        }
        
        // Test if there are any users
        const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log(`Users count: ${userCount.rows[0].count}`);
        
        if (userCount.rows[0].count === '0') {
            console.log('Creating test user...');
            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.hash('password123', 10);
            
            await pool.query(`
                INSERT INTO users (username, email, password_hash, display_name, role)
                VALUES ($1, $2, $3, $4, $5)
            `, ['testuser', 'test@example.com', hashedPassword, 'Test User', 'user']);
            
            console.log('✅ Test user created (username: testuser, password: password123)');
        }
        
        console.log('✅ Database check completed successfully!');
        
    } catch (error) {
        console.error('❌ Database check failed:', error);
    } finally {
        process.exit(0);
    }
}

checkAndFixDatabase();
