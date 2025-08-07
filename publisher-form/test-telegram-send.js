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

async function testSendMessage() {
  try {
    console.log('🧪 Testing Telegram message sending...');
    
    // Test with a sample chat ID (you'll need to replace this with a real chat ID)
    const testChatId = '123456789'; // Replace with actual chat ID
    const testMessage = '🧪 This is a test message from Big Drops Marketing Bot';
    
    console.log('📤 Sending test message to chat ID:', testChatId);
    const result = await sendMessage(testChatId, testMessage);
    
    if (result.ok) {
      console.log('✅ Message sent successfully!');
      console.log('📋 Message ID:', result.result.message_id);
      console.log('📅 Date:', new Date(result.result.date * 1000));
    } else {
      console.log('❌ Failed to send message:', result.description);
      console.log('🔍 Error code:', result.error_code);
    }
    
  } catch (error) {
    console.log('❌ Error sending message:', error.message);
  }
}

// Also test getting bot info
async function getBotInfo() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/getMe`,
      method: 'GET'
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

    req.end();
  });
}

async function runTests() {
  console.log('🤖 Testing Telegram Bot...\n');
  
  // Test 1: Get bot info
  try {
    console.log('1️⃣ Getting bot information...');
    const botInfo = await getBotInfo();
    
    if (botInfo.ok) {
      console.log('✅ Bot info retrieved successfully');
      console.log('🤖 Bot name:', botInfo.result.first_name);
      console.log('👤 Username:', botInfo.result.username);
      console.log('🆔 Bot ID:', botInfo.result.id);
      console.log('📝 Can join groups:', botInfo.result.can_join_groups);
      console.log('📢 Can read all group messages:', botInfo.result.can_read_all_group_messages);
      console.log('🔧 Supports inline queries:', botInfo.result.supports_inline_queries);
    } else {
      console.log('❌ Failed to get bot info:', botInfo.description);
    }
  } catch (error) {
    console.log('❌ Error getting bot info:', error.message);
  }
  
  console.log('\n2️⃣ Testing message sending...');
  console.log('⚠️ Note: You need to provide a valid chat ID to test message sending');
  console.log('💡 To get your chat ID:');
  console.log('   1. Send /start to your bot');
  console.log('   2. Check the webhook logs or database');
  console.log('   3. Replace the testChatId in this script\n');
  
  // Uncomment the line below and replace with actual chat ID to test
  // await testSendMessage();
}

runTests();
