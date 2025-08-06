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
    const headers = Object.fromEntries(request.headers.entries());
    
    
    const update = await request.json();
    
    
    
    if (update.message) {
      const msg = update.message;

    }
    
    if (update.message?.text?.startsWith('/start')) {
      
      const chatId = update.message.chat.id;
      const username = update.message.chat.username || update.message.from?.username;
      const firstName = update.message.chat.first_name || update.message.from?.first_name;
      
      
      if (!username) {
        
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        
        if (botToken) {
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
          if (!responseData.ok) {
          }
        }
        
        return NextResponse.json({ ok: true, message: 'No username provided' });
      }
      
      
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
        
        
        const verify = await pool.query(
          'SELECT * FROM telegram_users WHERE username = $1',
          [username]
        );
        
        const countResult = await pool.query('SELECT COUNT(*) as total FROM telegram_users');
        
        await pool.end();
        
      } catch (dbError) {
        
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
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
          
          if (responseData.ok) {
          } else {
          }
          
        } catch (msgError) {
        }
      } else {
      }
      
    } else {
    }
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({ ok: true, processing_time: processingTime });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({ 
      ok: false, 
      error: 'Webhook processing failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      processing_time: processingTime
    }, { status: 500 });
  }
} 