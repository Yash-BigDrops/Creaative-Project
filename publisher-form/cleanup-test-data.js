const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_R5eKDZ4gdAsk@ep-winter-wind-aehcpswx-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning up test data...\n');
    
    // Show current data
    console.log('📋 Current users in database:');
    const currentUsers = await pool.query('SELECT * FROM telegram_users ORDER BY created_at DESC');
    currentUsers.rows.forEach((user, index) => {
      console.log(`${index + 1}. @${user.username} (ID: ${user.chat_id}) - ${user.first_name}`);
    });
    
    // Delete test data with fake chat_id
    console.log('\n🗑️  Removing test entries with fake chat IDs...');
    const deleteResult = await pool.query(
      'DELETE FROM telegram_users WHERE chat_id = $1 RETURNING username, chat_id',
      ['123456789'] // This is the test chat_id
    );
    
    if (deleteResult.rows.length > 0) {
      console.log('✅ Deleted test entries:');
      deleteResult.rows.forEach(user => {
        console.log(`   - @${user.username} (${user.chat_id})`);
      });
    } else {
      console.log('ℹ️  No test entries found to delete');
    }
    
    // Show final data
    console.log('\n📋 Users after cleanup:');
    const finalUsers = await pool.query('SELECT * FROM telegram_users ORDER BY created_at DESC');
    if (finalUsers.rows.length > 0) {
      finalUsers.rows.forEach((user, index) => {
        console.log(`${index + 1}. @${user.username} (ID: ${user.chat_id}) - ${user.first_name}`);
      });
    } else {
      console.log('   No users in database');
    }
    
    console.log('\n✅ Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await pool.end();
  }
}

cleanupTestData(); 