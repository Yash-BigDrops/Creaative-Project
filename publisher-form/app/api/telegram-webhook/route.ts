import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('\n🚀 === TELEGRAM WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    
    // Log headers (excluding sensitive info)
    const headers = Object.fromEntries(request.headers.entries());
    console.log('Headers:', {
      'content-type': headers['content-type'],
      'user-agent': headers['user-agent'],
      'content-length': headers['content-length']
    });
    
    const update = await request.json();
    console.log('📨 Full update received:', JSON.stringify(update, null, 2));
    
    // Detailed update analysis
    console.log('📊 Update Analysis:');
    console.log('- Update ID:', update.update_id);
    console.log('- Has message:', !!update.message);
    console.log('- Has edited_message:', !!update.edited_message);
    console.log('- Has callback_query:', !!update.callback_query);
    console.log('- Other keys:', Object.keys(update).filter(k => !['update_id', 'message', 'edited_message', 'callback_query'].includes(k)));
    
    if (update.message) {
      const msg = update.message;
      console.log('💬 Message Details:');
      console.log('- Message ID:', msg.message_id);
      console.log('- Text:', msg.text);
      console.log('- Date:', new Date(msg.date * 1000).toISOString());
      console.log('- Chat ID:', msg.chat.id);
      console.log('- Chat type:', msg.chat.type);
      console.log('- Chat username:', msg.chat.username);
      console.log('- Chat first_name:', msg.chat.first_name);
      console.log('- Chat last_name:', msg.chat.last_name);
      console.log('- From ID:', msg.from?.id);
      console.log('- From username:', msg.from?.username);
      console.log('- From first_name:', msg.from?.first_name);
    }
    
    if (update.message?.text === '/start') {
      console.log('🎯 Processing /start command...');
      
      const chatId = update.message.chat.id;
      const username = update.message.chat.username || update.message.from?.username;
      const firstName = update.message.chat.first_name || update.message.from?.first_name;
      
      console.log('👤 User Info:');
      console.log(`- Chat ID: ${chatId} (type: ${typeof chatId})`);
      console.log(`- Username: ${username}`);
      console.log(`- First Name: ${firstName}`);
      
      if (!username) {
        console.log('❌ No username found - asking user to set one');
        
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        console.log('Bot token available:', !!botToken);
        
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
          console.log('Username error message sent:', responseData.ok);
          if (!responseData.ok) {
            console.log('Failed to send message:', responseData);
          }
        }
        
        return NextResponse.json({ ok: true, message: 'No username provided' });
      }
      
      // Database operations
      console.log('💾 Starting database operations...');
      
      try {
        // Test connection
        console.log('Testing database connection...');
        const connectionTest = await pool.query('SELECT NOW() as current_time, version() as pg_version');
        console.log('✅ Database connected:', {
          time: connectionTest.rows[0].current_time,
          version: connectionTest.rows[0].pg_version.split(' ')[0] + ' ' + connectionTest.rows[0].pg_version.split(' ')[1]
        });
        
        // Check table existence
        console.log('Checking table existence...');
        const tableCheck = await pool.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'telegram_users'
          )`
        );
        
        const tableExists = tableCheck.rows[0]?.exists;
        console.log('Table exists:', tableExists);
        
        if (!tableExists) {
          console.log('⚠️ Table does not exist - creating...');
          await pool.query(`
            CREATE TABLE telegram_users (
              id SERIAL PRIMARY KEY,
              username VARCHAR(255) UNIQUE NOT NULL,
              chat_id BIGINT NOT NULL,
              first_name VARCHAR(255),
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            )
          `);
          console.log('✅ Table created successfully');
        }
        
        // Insert/update user
        console.log('Inserting/updating user...');
        console.log('Query params:', { username, chatId, firstName });
        
        const result = await pool.query(
          `INSERT INTO telegram_users (username, chat_id, first_name, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (username) 
           DO UPDATE SET 
             chat_id = EXCLUDED.chat_id,
             first_name = EXCLUDED.first_name,
             updated_at = NOW()
           RETURNING id, username, chat_id, first_name, created_at, updated_at`,
          [username, chatId, firstName]
        );
        
        console.log('✅ Database operation successful!');
        console.log('Result:', result.rows[0]);
        
        // Verify the insert
        const verifyResult = await pool.query(
          'SELECT * FROM telegram_users WHERE username = $1',
          [username]
        );
        console.log('✅ Verification query result:', verifyResult.rows[0]);
        
        // Count total users
        const countResult = await pool.query('SELECT COUNT(*) as total FROM telegram_users');
        console.log('📊 Total users in database:', countResult.rows[0].total);
        
      } catch (dbError) {
        console.error('❌ Database error occurred:');
        console.error('Error type:', dbError instanceof Error ? dbError.constructor.name : 'Unknown');
        console.error('Error message:', dbError instanceof Error ? dbError.message : 'Unknown error');
        console.error('Error code:', (dbError as { code?: string })?.code);
        console.error('Error detail:', (dbError as { detail?: string })?.detail);
        console.error('Error hint:', (dbError as { hint?: string })?.hint);
        console.error('Error position:', (dbError as { position?: string })?.position);
        console.error('Error constraint:', (dbError as { constraint?: string })?.constraint);
        console.error('Full error:', dbError);
        
        // Send error message to user
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: "❌ There was an error registering your account. Please contact support and mention this error occurred during registration.",
              parse_mode: "HTML"
            })
          });
        }
        
        return NextResponse.json({ ok: false, error: 'Database error', details: dbError instanceof Error ? dbError.message : 'Unknown error' });
      }
      
      // Send welcome message
      console.log('📤 Sending welcome message...');
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      console.log('Bot token available:', !!botToken);
      console.log('Bot token prefix:', botToken ? botToken.substring(0, 10) + '...' : 'none');
      
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
          console.log('Welcome message response:', responseData);
          
          if (responseData.ok) {
            console.log('✅ Welcome message sent successfully');
          } else {
            console.error('❌ Failed to send welcome message:', responseData);
          }
          
        } catch (msgError) {
          console.error('❌ Error sending welcome message:', msgError);
        }
      } else {
        console.log('❌ No bot token available - cannot send welcome message');
      }
      
    } else {
      console.log('📝 Non-/start message received:', {
        text: update.message?.text,
        type: update.message ? 'message' : Object.keys(update)[1] || 'unknown'
      });
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`⏱️ Webhook processing completed in ${processingTime}ms`);
    console.log('🏁 === WEBHOOK PROCESSING COMPLETE ===\n');
    
    return NextResponse.json({ ok: true, processing_time: processingTime });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('\n💥 === FATAL WEBHOOK ERROR ===');
    console.error('Processing time before error:', processingTime + 'ms');
    console.error('Error type:', error instanceof Error ? error.constructor.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('=== END ERROR LOG ===\n');
    
    return NextResponse.json({ 
      ok: false, 
      error: 'Webhook processing failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      processing_time: processingTime
    }, { status: 500 });
  }
} 