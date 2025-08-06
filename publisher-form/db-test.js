const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_R5eKDZ4gdAsk@ep-winter-wind-aehcpswx-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testDatabase() {
  try {
    const timeResult = await pool.query('SELECT NOW() as current_time');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'telegram_users'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
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
    }
    
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
    
    const selectResult = await pool.query(
      'SELECT * FROM telegram_users WHERE username = $1',
      ['samiwasta']
    );
    
    const allUsers = await pool.query(
      'SELECT username, chat_id, first_name, created_at FROM telegram_users ORDER BY created_at DESC'
    );
    
    if (allUsers.rows.length === 0) {
    } else {
      allUsers.rows.forEach((user, index) => {
        console.log(`${index + 1}. @${user.username} (${user.chat_id}) - ${user.first_name}`);
      });
    }
    
  } catch (error) {
  } finally {
    await pool.end();
  }
}

testDatabase(); 