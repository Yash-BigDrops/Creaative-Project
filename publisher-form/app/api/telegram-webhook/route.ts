import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('📥 Telegram webhook received');
    const headers = Object.fromEntries(request.headers.entries());
    console.log('📋 Headers:', Object.keys(headers));
    
    const update = await request.json();
    console.log('📨 Update received:', JSON.stringify(update, null, 2));
    
    if (update.message) {
      const msg = update.message;
      console.log('💬 Message from:', msg.from?.username || msg.from?.first_name, 'Chat ID:', msg.chat?.id);
    }
    
    if (update.message?.text?.startsWith('/start')) {
      console.log('🚀 /start command received');
      
      const chatId = update.message.chat.id;
      const username = update.message.chat.username || update.message.from?.username;
      const firstName = update.message.chat.first_name || update.message.from?.first_name;
      
      console.log('👤 User details:', { chatId, username, firstName });
      
      if (!username) {
        console.log('⚠️ No username provided');
        
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        
        if (botToken) {
          console.log('📤 Sending username requirement message');
          const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: "⚠️ Please set a username in your Telegram profile first, then send /start again. This is required to connect your account.",
              parse_mode: "HTML"
            })
          });
          
          const responseData = await response.json();
          console.log('📤 Username requirement message response:', responseData);
          if (!responseData.ok) {
            console.log('❌ Failed to send username requirement message:', responseData.description);
          }
        } else {
          console.log('❌ TELEGRAM_BOT_TOKEN not configured');
        }
        
        return NextResponse.json({ ok: true, message: 'No username provided' });
      }
      
      console.log('💾 Saving user to database...');
      try {
        const pool = getPool();
        const result = await pool.query(
          `INSERT INTO telegram_users (username, chat_id, first_name, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (username) 
           DO UPDATE SET 
             chat_id = EXCLUDED.chat_id,
             first_name = EXCLUDED.first_name,
             updated_at = NOW()
           RETURNING id, username, chat_id, first_name, created_at`,
          [username, chatId, firstName]
        );
        
        console.log('✅ User saved to database:', result.rows[0]);
        
        const verify = await pool.query(
          'SELECT * FROM telegram_users WHERE username = $1',
          [username]
        );
        
        const countResult = await pool.query('SELECT COUNT(*) as total FROM telegram_users');
        console.log('📊 Total users in database:', countResult.rows[0].total);
        
        await pool.end();
        
      } catch (dbError) {
        console.log('❌ Database error:', dbError);
        
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          console.log('📤 Sending database error message');
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: "❌ There was an error registering your account. Please contact support.",
              parse_mode: "HTML"
            })
          });
        }
        
        return NextResponse.json({ ok: false, error: 'Database error', details: dbError instanceof Error ? dbError.message : 'Unknown error' });
      }
      
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      
      if (botToken) {
        console.log('📤 Sending welcome message');
        try {
          const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: "✅ Welcome! You're now connected to Big Drops Marketing notifications. You'll receive updates about your creative submissions here.",
              parse_mode: "HTML"
            })
          });
          
          const responseData = await response.json();
          console.log('📤 Welcome message response:', responseData);
          
          if (responseData.ok) {
            console.log('✅ Welcome message sent successfully');
          } else {
            console.log('❌ Failed to send welcome message:', responseData.description);
          }
          
        } catch (msgError) {
          console.log('❌ Error sending welcome message:', msgError);
        }
      } else {
        console.log('❌ TELEGRAM_BOT_TOKEN not configured');
      }
      
    } else {
      console.log('📝 Non-/start message received');
    }
    
    const processingTime = Date.now() - startTime;
    console.log('⏱️ Processing time:', processingTime + 'ms');
    
    return NextResponse.json({ ok: true, processing_time: processingTime });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.log('❌ Webhook error:', error);
    
    return NextResponse.json({ 
      ok: false, 
      error: 'Webhook processing failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      processing_time: processingTime
    }, { status: 500 });
  }
} 