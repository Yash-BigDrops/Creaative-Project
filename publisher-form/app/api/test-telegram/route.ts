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
    const { username, chatId, firstName } = await request.json();
    
    if (!username || !chatId) {
      return NextResponse.json({ 
        error: 'Username and chatId are required' 
      }, { status: 400 });
    }


    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO telegram_users (username, chat_id, first_name, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (username) 
       DO UPDATE SET 
         chat_id = EXCLUDED.chat_id,
         first_name = EXCLUDED.first_name,
         updated_at = NOW()
       RETURNING username, chat_id, first_name`,
      [username, chatId, firstName || 'Test User']
    );
    
    
    await pool.end();
    
    return NextResponse.json({
      success: true,
      user: result.rows[0],
      message: `Test user @${username} added/updated successfully`
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 