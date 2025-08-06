const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_R5eKDZ4gdAsk@ep-winter-wind-aehcpswx-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function listAllTables() {
  try {
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
    } else {
      tablesResult.rows.forEach((table, index) => {
        console.log(`${index + 1}. ${table.table_name}`);
      });
    }
    
    const dbResult = await pool.query('SELECT current_database() as db_name, current_user as user_name');
    console.log(`Database: ${dbResult.rows[0].db_name}`);
    console.log(`User: ${dbResult.rows[0].user_name}`);
    
  } catch (error) {
  } finally {
    await pool.end();
  }
}

listAllTables(); 