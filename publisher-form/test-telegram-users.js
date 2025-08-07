const { Pool } = require('pg');

const getPool = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
};

const https = require('https');

const BOT_TOKEN = '8270513237:AAFDQKccnayiW8CiWyHLtBXjriZ8e7k4QBQ';

function sendMessage(chatId, text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML"
    });
    
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function checkUsersAndTestMessage() {
  try {
    console.log('🔍 Checking registered Telegram users...');
    
    const pool = getPool();
    
    // Check if table exists
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'telegram_users'
      )`
    );
    
    if (!tableCheck.rows[0]?.exists) {
      console.log('❌ telegram_users table does not exist');
      await pool.end();
      return;
    }
    
    // Get all users
    const users = await pool.query(
      `SELECT id, username, chat_id, first_name, created_at 
       FROM telegram_users 
       ORDER BY created_at DESC`
    );
    
    console.log(`📊 Found ${users.rows.length} registered users:`);
    
    if (users.rows.length === 0) {
      console.log('⚠️ No users registered yet. Users need to send /start to the bot first.');
      console.log('💡 To test:');
      console.log('   1. Go to @BigDropsMarketingBot on Telegram');
      console.log('   2. Send /start');
      console.log('   3. Run this script again');
    } else {
      users.rows.forEach((user, index) => {
        console.log(`\n👤 User ${index + 1}:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: @${user.username}`);
        console.log(`   Chat ID: ${user.chat_id}`);
        console.log(`   Name: ${user.first_name}`);
        console.log(`   Registered: ${new Date(user.created_at).toLocaleString()}`);
      });
      
      // Test sending message to the first user
      const firstUser = users.rows[0];
      console.log(`\n🧪 Testing message sending to @${firstUser.username} (Chat ID: ${firstUser.chat_id})...`);
      
      const testMessage = `🧪 Test message from Big Drops Marketing Bot

This is a test message to verify that the bot can send messages successfully.

Time: ${new Date().toLocaleString()}
User: @${firstUser.username}`;
      
      const result = await sendMessage(firstUser.chat_id, testMessage);
      
      if (result.ok) {
        console.log('✅ Test message sent successfully!');
        console.log('📋 Message ID:', result.result.message_id);
        console.log('📅 Date:', new Date(result.result.date * 1000).toLocaleString());
      } else {
        console.log('❌ Failed to send test message:', result.description);
        console.log('🔍 Error code:', result.error_code);
        
        if (result.error_code === 403) {
          console.log('💡 This usually means the user has blocked the bot or deleted the chat');
        } else if (result.error_code === 400) {
          console.log('💡 This might be an invalid chat ID or bot permissions issue');
        }
      }
    }
    
    await pool.end();
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkUsersAndTestMessage();
