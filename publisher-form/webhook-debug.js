const https = require('https');
const http = require('http');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://publisher-form-nu.vercel.app/api/telegram-webhook';

if (!BOT_TOKEN) {
  process.exit(1);
}

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
  try {
    const botInfo = await testBotToken();
    if (botInfo.ok) {
    } else {
      return;
    }
    
    const webhookInfo = await getWebhookInfo();
    
    if (webhookInfo.ok) {
      const info = webhookInfo.result;
      if (!info.url) {
        return;
      }
      
      if (info.last_error_message) {
        return;
      }
      
      if (info.pending_update_count > 0) {
      }
      
    } else {
      return;
    }
    
    try {
      const endpointResult = await testWebhookEndpoint();
      if (endpointResult.statusCode === 200) {
      } else {
      }
      
    } catch (endpointError) {
    }
    
  } catch (error) {
  }
}

debugWebhook();