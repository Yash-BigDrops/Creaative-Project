const https = require('https');

const BOT_TOKEN = '8270513237:AAFDQKccnayiW8CiWyHLtBXjriZ8e7k4QBQ';

async function getUpdates() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/getUpdates?limit=10&timeout=30`,
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

async function monitorWebhook() {
  console.log('🔍 === MONITORING WEBHOOK ACTIVITY ===\n');
  console.log('This will show recent updates sent to your bot...\n');
  
  try {
    const updates = await getUpdates();
    
    if (updates.ok) {
      console.log(`📊 Found ${updates.result.length} recent updates:\n`);
      
      if (updates.result.length === 0) {
        console.log('📭 No recent updates found.');
        console.log('This means either:');
        console.log('1. No one has interacted with your bot recently');
        console.log('2. Updates are being processed by webhook (not polling)');
        console.log('3. Updates are being cleared automatically');
      } else {
        updates.result.forEach((update, index) => {
          console.log(`📨 Update ${index + 1}:`);
          console.log(`   Update ID: ${update.update_id}`);
          console.log(`   Type: ${update.message ? 'message' : Object.keys(update)[1] || 'unknown'}`);
          
          if (update.message) {
            const msg = update.message;
            console.log(`   Message ID: ${msg.message_id}`);
            console.log(`   Text: "${msg.text || 'No text'}"`);
            console.log(`   Date: ${new Date(msg.date * 1000).toISOString()}`);
            console.log(`   Chat ID: ${msg.chat.id}`);
            console.log(`   Chat Type: ${msg.chat.type}`);
            console.log(`   Username: @${msg.chat.username || 'No username'}`);
            console.log(`   First Name: ${msg.chat.first_name || 'No name'}`);
            console.log(`   From ID: ${msg.from?.id}`);
            console.log(`   From Username: @${msg.from?.username || 'No username'}`);
            
            if (msg.text === '/start') {
              console.log('   🎯 This is a /start command!');
            }
          }
          
          if (update.callback_query) {
            console.log(`   Callback Query: ${update.callback_query.data}`);
          }
          
          console.log('');
        });
      }
    } else {
      console.log('❌ Failed to get updates:', updates);
    }
    
    console.log('💡 To see real-time webhook activity:');
    console.log('1. Send a message to your bot');
    console.log('2. Check your Vercel deployment logs');
    console.log('3. Run this script again to see recent updates');
    
  } catch (error) {
    console.error('❌ Error monitoring webhook:', error);
  }
}

monitorWebhook(); 