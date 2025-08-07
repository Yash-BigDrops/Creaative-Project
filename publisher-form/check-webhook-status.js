const https = require('https');

const BOT_TOKEN = '8270513237:AAFDQKccnayiW8CiWyHLtBXjriZ8e7k4QBQ';

function getWebhookInfo() {
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

async function checkWebhookStatus() {
  try {
    console.log('🔍 Checking Telegram webhook status...');
    const webhookInfo = await getWebhookInfo();
    
    if (webhookInfo.ok) {
      const info = webhookInfo.result;
      console.log('✅ Webhook info retrieved successfully');
      console.log('📋 Webhook URL:', info.url || 'Not set');
      console.log('📊 Pending updates:', info.pending_update_count);
      console.log('🔄 Last error date:', info.last_error_date);
      console.log('❌ Last error message:', info.last_error_message);
      
      if (!info.url) {
        console.log('⚠️ No webhook URL is set!');
      } else if (info.last_error_message) {
        console.log('❌ Webhook has errors:', info.last_error_message);
      } else if (info.pending_update_count > 0) {
        console.log('📥 There are pending updates to process');
      } else {
        console.log('✅ Webhook is working correctly');
      }
    } else {
      console.log('❌ Failed to get webhook info:', webhookInfo.description);
    }
    
  } catch (error) {
    console.log('❌ Error checking webhook status:', error.message);
  }
}

checkWebhookStatus(); 