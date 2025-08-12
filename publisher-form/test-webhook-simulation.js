require('dotenv').config({ path: '.env.development.local' });

const https = require('https');

const WEBHOOK_URL = 'https://publisher-form-nu.vercel.app/api/telegram-webhook';

// Simulate a /start message from a user
const mockUpdate = {
  update_id: 123456789,
  message: {
    message_id: 1,
    from: {
      id: 987654321,
      is_bot: false,
      first_name: "Test",
      username: "testuser",
      language_code: "en"
    },
    chat: {
      id: 987654321,
      first_name: "Test",
      username: "testuser",
      type: "private"
    },
    date: Math.floor(Date.now() / 1000),
    text: "/start"
  }
};

function sendWebhookSimulation() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(mockUpdate);
    
    const options = {
      hostname: 'publisher-form-nu.vercel.app',
      port: 443,
      path: '/api/telegram-webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'User-Agent': 'TelegramBot/1.0'
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
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
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

async function testWebhookSimulation() {
  try {
    console.log('🧪 Testing webhook simulation...');
    console.log('📤 Sending mock /start message to webhook...');
    
    const result = await sendWebhookSimulation();
    
    console.log('📥 Webhook response status:', result.status);
    console.log('📥 Webhook response data:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 200) {
      console.log('✅ Webhook responded successfully');
    } else {
      console.log('❌ Webhook returned error status:', result.status);
    }
    
  } catch (error) {
    console.log('❌ Error testing webhook:', error.message);
  }
}

// Also test direct message sending
async function testDirectMessage() {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  
  // You'll need to replace this with a real chat ID
  const testChatId = '123456789'; // Replace with actual chat ID
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: testChatId,
      text: "🧪 Direct test message from Big Drops Marketing Bot\n\nThis is a direct test to verify the bot can send messages.",
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
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
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

async function runTests() {
  console.log('🤖 Testing Telegram functionality...\n');
  
  // Test 1: Webhook simulation
  console.log('1️⃣ Testing webhook simulation...');
  await testWebhookSimulation();
  
  console.log('\n2️⃣ Testing direct message sending...');
  console.log('⚠️ Note: You need to provide a valid chat ID to test direct messaging');
  console.log('💡 To get your chat ID:');
  console.log('   1. Send /start to @BigDropsMarketingBot');
  console.log('   2. Check the webhook logs');
  console.log('   3. Replace the testChatId in this script\n');
  
  // Uncomment the line below and replace with actual chat ID to test
  // const directResult = await testDirectMessage();
  // console.log('📤 Direct message result:', directResult);
}

runTests();
