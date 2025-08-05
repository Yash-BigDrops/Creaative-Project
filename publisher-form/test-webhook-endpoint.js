const https = require('https');
const http = require('http');

// Configuration
const WEBHOOK_URL = 'https://publisher-form-nu.vercel.app/api/telegram-webhook';

// Test data - simulate a real Telegram update
const testUpdate = {
  update_id: 999999999,
  message: {
    message_id: 1,
    from: {
      id: 123456789,
      is_bot: false,
      first_name: "Test",
      username: "samiwasta", // Use the actual username you're testing
      language_code: "en"
    },
    chat: {
      id: 123456789,
      first_name: "Test",
      username: "samiwasta", // Use the actual username you're testing
      type: "private"
    },
    date: Math.floor(Date.now() / 1000),
    text: "/start"
  }
};

async function testWebhookEndpoint() {
  console.log('🧪 === TESTING WEBHOOK ENDPOINT ===\n');
  console.log('Target URL:', WEBHOOK_URL);
  console.log('Test Update:', JSON.stringify(testUpdate, null, 2));
  console.log('\nSending test request...\n');
  
  return new Promise((resolve, reject) => {
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
      console.log('📡 Response received:');
      console.log('Status Code:', res.statusCode);
      console.log('Headers:', res.headers);
      
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('\n📄 Response Body:');
        try {
          const result = JSON.parse(responseData);
          console.log(JSON.stringify(result, null, 2));
          
          if (res.statusCode === 200) {
            console.log('\n✅ SUCCESS: Webhook endpoint responded with 200 OK');
            if (result.ok) {
              console.log('✅ Webhook processing completed successfully');
            } else {
              console.log('⚠️ Webhook returned ok: false');
            }
          } else {
            console.log(`\n⚠️ WARNING: Webhook returned status ${res.statusCode}`);
          }
          
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: result
          });
        } catch (error) {
          console.log('Raw response:', responseData);
          console.log('\n⚠️ Response is not valid JSON');
          
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('\n❌ ERROR: Failed to connect to webhook endpoint');
      console.log('Error:', error.message);
      console.log('\nPossible issues:');
      console.log('1. Webhook URL is incorrect');
      console.log('2. Server is down or not responding');
      console.log('3. Network connectivity issues');
      console.log('4. SSL/TLS certificate problems');
      
      reject(error);
    });

    req.on('timeout', () => {
      console.log('\n⏰ TIMEOUT: Request timed out');
      req.destroy();
    });

    // Set timeout to 30 seconds
    req.setTimeout(30000);

    console.log('📤 Sending request...');
    req.write(JSON.stringify(testUpdate));
    req.end();
  });
}

async function runTest() {
  try {
    const result = await testWebhookEndpoint();
    
    console.log('\n📋 === TEST SUMMARY ===');
    console.log('Status Code:', result.statusCode);
    console.log('Response OK:', result.body?.ok || 'N/A');
    console.log('Processing Time:', result.body?.processing_time || 'N/A');
    
    if (result.statusCode === 200 && result.body?.ok) {
      console.log('\n🎉 SUCCESS: Webhook is working correctly!');
      console.log('The endpoint can receive and process Telegram updates.');
    } else if (result.statusCode === 200) {
      console.log('\n⚠️ PARTIAL SUCCESS: Endpoint responded but processing failed');
      console.log('Check the response body for error details.');
    } else {
      console.log('\n❌ FAILURE: Webhook endpoint is not working properly');
      console.log('Check your deployment and server logs.');
    }
    
  } catch (error) {
    console.log('\n💥 TEST FAILED:', error.message);
  }
}

runTest(); 