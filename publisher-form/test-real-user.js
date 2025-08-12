require('dotenv').config({ path: '.env.development.local' });

const { Pool } = require('pg');
const https = require('https');

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

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

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

async function testRealUser() {
  try {
    console.log('🧪 Testing with real user...');
    
    const pool = getPool();
    
    // Get the most recently registered real user (skip the test user)
    const users = await pool.query(
      `SELECT id, username, chat_id, first_name, created_at 
       FROM telegram_users 
       WHERE username != 'testuser'
       ORDER BY created_at DESC
       LIMIT 1`
    );
    
    if (users.rows.length === 0) {
      console.log('❌ No real users found in database');
      await pool.end();
      return;
    }
    
    const user = users.rows[0];
    console.log(`👤 Testing with user: @${user.username} (Chat ID: ${user.chat_id})`);
    
    const testMessage = `🧪 Test message from Big Drops Marketing Bot

This is a test message to verify that the bot can send messages successfully.

Time: ${new Date().toLocaleString()}
User: @${user.username}

If you receive this message, the Telegram integration is working correctly! 🎉`;
    
    console.log('📤 Sending test message...');
    const result = await sendMessage(user.chat_id, testMessage);
    
    if (result.ok) {
      console.log('✅ Test message sent successfully!');
      console.log('📋 Message ID:', result.result.message_id);
      console.log('📅 Date:', new Date(result.result.date * 1000).toLocaleString());
      console.log('🎉 Telegram message sending is working correctly!');
    } else {
      console.log('❌ Failed to send test message:', result.description);
      console.log('🔍 Error code:', result.error_code);
      
      if (result.error_code === 403) {
        console.log('💡 User has blocked the bot or deleted the chat');
      } else if (result.error_code === 400) {
        console.log('💡 Invalid chat ID or bot permissions issue');
      }
    }
    
    await pool.end();
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testRealUser();
