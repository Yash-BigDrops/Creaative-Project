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
  try {
    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json({ started: false, message: "No username provided" });
    }

    const cleanUsername = username.trim().replace(/^@/, '');

    const pool = getPool();

    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'telegram_users'
      )`
    );
    
    const tableExists = tableCheck.rows[0]?.exists;
    
    if (!tableExists) {
      await pool.end();
      return NextResponse.json({ 
        started: false, 
        message: "Database table not found. Please contact support." 
      });
    }

    const result = await pool.query(
      `SELECT chat_id, first_name 
       FROM telegram_users 
       WHERE username = $1`,
      [cleanUsername]
    );


    if (result.rows.length === 0) {
      
      const allUsers = await pool.query(
        `SELECT username, chat_id, first_name, created_at
         FROM telegram_users
         ORDER BY created_at DESC
         LIMIT 5`
      );
      
      await pool.end();
      return NextResponse.json({ 
        started: false, 
        message: `User @${cleanUsername} not found. Please start the bot first by sending /start to @BigDropsMarketingBot` 
      });
    }

    const user = result.rows[0];

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      await pool.end();
      return NextResponse.json({ started: false });
    }

    const msgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: user.chat_id,
        text: "✅ Telegram connection verified!",
        disable_notification: true
      })
    });

    const msgData = await msgRes.json();

    if (msgData.ok) {
      await pool.end();
      return NextResponse.json({ started: true, message: "Telegram connection verified successfully!" });
    } else {
      await pool.end();
      return NextResponse.json({ 
        started: false, 
        message: `Failed to send test message: ${msgData.description}` 
      });
    }

  } catch (err) {
    return NextResponse.json({ started: false });
  }
} 