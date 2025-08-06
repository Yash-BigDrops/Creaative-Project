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
    const webhookInfo = await getWebhookInfo();
    
    if (webhookInfo.ok) {
      const info = webhookInfo.result;
      
      
      
      if (!info.url) {
      } else if (info.last_error_message) {
      } else if (info.pending_update_count > 0) {
      } else {
      }
    } else {
    }
    
  } catch (error) {
  }
}

checkWebhookStatus(); 