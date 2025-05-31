// Test database connection and auth functionality
import { pool } from '../src/lib/db.js';
import { AuthService } from '../src/lib/auth.js';

async function testDatabase() {
    try {
        console.log('Testing database connection...');
        
        // Test basic connection
        const result = await pool.query('SELECT 1 as test');
        console.log('✅ Database connection successful:', result.rows[0]);
        
        // Test users table exists
        const tableResult = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.log('✅ Users table structure:', tableResult.rows);
        
        // Test if any users exist
        const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log('✅ Number of users:', usersResult.rows[0].count);
        
        // If no users, create a test user
        if (usersResult.rows[0].count === '0') {
            console.log('Creating test user...');
            try {
                const newUser = await AuthService.register('testuser', 'test@example.com', 'password123', 'Test User');
                console.log('✅ Test user created:', newUser);
            } catch (error) {
                console.log('❌ Error creating test user:', error.message);
            }
        }
        
        console.log('✅ All database tests passed!');
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        process.exit(0);
    }
}

testDatabase();
