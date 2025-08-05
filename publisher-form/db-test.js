const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_R5eKDZ4gdAsk@ep-winter-wind-aehcpswx-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testDatabase() {
  try {
    console.log('🧪 Testing Creative_Files Database Connection...');
    console.log('==============================================');
    
    // Test connection
    console.log('\n1️⃣ Testing database connection...');
    const timeResult = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Connection successful:', timeResult.rows[0]);
    
    // Check if table exists
    console.log('\n2️⃣ Checking if telegram_users table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'telegram_users'
      )
    `);
    
    console.log('Table exists:', tableCheck.rows[0].exists);
    
    // Create table if it doesn't exist
    if (!tableCheck.rows[0].exists) {
      console.log('\n3️⃣ Creating telegram_users table...');
      await pool.query(`
        CREATE TABLE telegram_users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          chat_id BIGINT NOT NULL,
          first_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ Table created successfully');
    } else {
      console.log('✅ Table already exists');
    }
    
    // Test insert
    console.log('\n4️⃣ Testing user insertion...');
    const insertResult = await pool.query(`
      INSERT INTO telegram_users (username, chat_id, first_name, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (username) 
      DO UPDATE SET 
        chat_id = EXCLUDED.chat_id,
        first_name = EXCLUDED.first_name,
        updated_at = NOW()
      RETURNING id, username, chat_id, first_name
    `, ['samiwasta', 123456789, 'Test User']);
    
    console.log('✅ Insert successful:', insertResult.rows[0]);
    
    // Test select
    console.log('\n5️⃣ Testing user retrieval...');
    const selectResult = await pool.query(
      'SELECT * FROM telegram_users WHERE username = $1',
      ['samiwasta']
    );
    
    console.log('✅ Select result:', selectResult.rows[0]);
    
    // Show all users
    console.log('\n6️⃣ All users in database:');
    const allUsers = await pool.query(
      'SELECT username, chat_id, first_name, created_at FROM telegram_users ORDER BY created_at DESC'
    );
    
    if (allUsers.rows.length === 0) {
      console.log('📭 No users found in database');
    } else {
      allUsers.rows.forEach((user, index) => {
        console.log(`${index + 1}. @${user.username} (${user.chat_id}) - ${user.first_name}`);
      });
    }
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

testDatabase(); 