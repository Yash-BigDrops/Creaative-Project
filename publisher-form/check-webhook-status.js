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
    console.log('🔍 Checking current webhook status...\n');
    
    const webhookInfo = await getWebhookInfo();
    
    if (webhookInfo.ok) {
      const info = webhookInfo.result;
      
      console.log('📋 Webhook Information:');
      console.log('================================');
      console.log('URL:', info.url || '❌ No webhook URL set');
      console.log('Has custom certificate:', info.has_custom_certificate || false);
      console.log('Pending update count:', info.pending_update_count || 0);
      console.log('Last error date:', info.last_error_date ? new Date(info.last_error_date * 1000) : 'None');
      console.log('Last error message:', info.last_error_message || 'None');
      console.log('Max connections:', info.max_connections || 'Default');
      console.log('Allowed updates:', info.allowed_updates || 'All');
      
      if (!info.url) {
        console.log('\n❌ PROBLEM: No webhook URL is configured!');
        console.log('You need to set up your webhook first.');
        console.log('Run: node setup-telegram-webhook.js https://yourdomain.com/api/telegram-webhook');
      } else if (info.last_error_message) {
        console.log('\n❌ PROBLEM: Webhook has errors!');
        console.log('Last error:', info.last_error_message);
        console.log('This means Telegram cannot reach your webhook URL.');
      } else if (info.pending_update_count > 0) {
        console.log('\n⚠️ WARNING: There are pending updates!');
        console.log('This might indicate the webhook is not processing updates properly.');
      } else {
        console.log('\n✅ Webhook appears to be configured correctly.');
      }
    } else {
      console.log('❌ Failed to get webhook info:', webhookInfo);
    }
    
  } catch (error) {
    console.error('❌ Error checking webhook:', error);
  }
}

checkWebhookStatus(); 