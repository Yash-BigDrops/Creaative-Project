const https = require('https');
const http = require('http');

const BOT_TOKEN = '8270513237:AAFDQKccnayiW8CiWyHLtBXjriZ8e7k4QBQ';
const WEBHOOK_URL = 'https://publisher-form-nu.vercel.app/api/telegram-webhook';

async function getWebhookInfo() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/getWebhookInfo`,
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

async function testWebhookEndpoint() {
  return new Promise((resolve, reject) => {
    const testUpdate = {
      update_id: 999999999,
      message: {
        message_id: 1,
        from: {
          id: 123456789,
          is_bot: false,
          first_name: "Test",
          username: "testuser",
          language_code: "en"
        },
        chat: {
          id: 123456789,
          first_name: "Test",
          username: "testuser",
          type: "private"
        },
        date: Math.floor(Date.now() / 1000),
        text: "/start"
      }
    };

    const url = new URL(WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TelegramBot/1.0',
        'Content-Length': JSON.stringify(testUpdate).length
      }
    };

    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: result
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(testUpdate));
    req.end();
  });
}

async function testBotToken() {
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

async function debugWebhook() {
  console.log('🔍 === TELEGRAM WEBHOOK DEBUG ===\n');
  
  try {
    // Test 1: Check Bot Token
    console.log('1️⃣ Testing Bot Token...');
    const botInfo = await testBotToken();
    if (botInfo.ok) {
      console.log('✅ Bot token is valid!');
      console.log(`   Bot: @${botInfo.result.username} (${botInfo.result.first_name})`);
      console.log(`   Bot ID: ${botInfo.result.id}`);
    } else {
      console.log('❌ Bot token is invalid!');
      console.log('   Error:', botInfo.description);
      return;
    }
    
    // Test 2: Check Webhook Configuration
    console.log('\n2️⃣ Checking Webhook Configuration...');
    const webhookInfo = await getWebhookInfo();
    
    if (webhookInfo.ok) {
      const info = webhookInfo.result;
      console.log('✅ Webhook info retrieved successfully');
      console.log(`   URL: ${info.url || '❌ Not set'}`);
      console.log(`   Pending updates: ${info.pending_update_count || 0}`);
      console.log(`   Last error: ${info.last_error_message || 'None'}`);
      console.log(`   Last error date: ${info.last_error_date ? new Date(info.last_error_date * 1000) : 'None'}`);
      
      if (!info.url) {
        console.log('\n❌ PROBLEM: No webhook URL configured!');
        console.log('   Solution: Run setup-telegram-webhook.js');
        return;
      }
      
      if (info.last_error_message) {
        console.log('\n❌ PROBLEM: Webhook has errors!');
        console.log(`   Error: ${info.last_error_message}`);
        return;
      }
      
      if (info.pending_update_count > 0) {
        console.log('\n⚠️ WARNING: Pending updates detected!');
        console.log('   This might indicate webhook processing issues.');
      }
      
    } else {
      console.log('❌ Failed to get webhook info:', webhookInfo);
      return;
    }
    
    // Test 3: Test Webhook Endpoint
    console.log('\n3️⃣ Testing Webhook Endpoint...');
    console.log(`   Testing URL: ${WEBHOOK_URL}`);
    
    try {
      const endpointResult = await testWebhookEndpoint();
      console.log('✅ Webhook endpoint is accessible!');
      console.log(`   Status Code: ${endpointResult.statusCode}`);
      console.log(`   Response: ${JSON.stringify(endpointResult.body, null, 2)}`);
      
      if (endpointResult.statusCode === 200) {
        console.log('✅ Endpoint returned 200 OK');
      } else {
        console.log(`⚠️ Endpoint returned ${endpointResult.statusCode}`);
      }
      
    } catch (endpointError) {
      console.log('❌ Webhook endpoint test failed!');
      console.log('   Error:', endpointError.message);
      console.log('   This means Telegram cannot reach your webhook URL');
    }
    
    // Test 4: Check Environment Variables
    console.log('\n4️⃣ Checking Environment Variables...');
    console.log('   TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Not set');
    console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
    
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.log('\n❌ PROBLEM: TELEGRAM_BOT_TOKEN not set!');
      console.log('   Add to .env.local: TELEGRAM_BOT_TOKEN=8270513237:AAFDQKccnayiW8CiWyHLtBXjriZ8e7k4QBQ');
    }
    
    // Summary
    console.log('\n📋 === DEBUG SUMMARY ===');
    console.log('✅ Bot token: Valid');
    console.log('✅ Webhook URL: Configured');
    console.log('✅ Webhook errors: None');
    console.log('✅ Endpoint accessibility: Tested');
    console.log('✅ Environment variables: Checked');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Send /start to your bot');
    console.log('2. Check Vercel logs for detailed webhook processing');
    console.log('3. If still not working, check server logs for errors');
    
  } catch (error) {
    console.error('\n💥 Debug failed:', error);
  }
}

debugWebhook(); 