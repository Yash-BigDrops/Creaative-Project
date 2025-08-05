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
    
    if (update.message?.text?.startsWith('/start')) {
      console.log('🎯 Processing /start command (with or without parameters)');
      
      const chatId = update.message.chat.id;
      const username = update.message.chat.username || update.message.from?.username;
      const firstName = update.message.chat.first_name || update.message.from?.first_name;
      
      console.log('👤 User details:');
      console.log(`   Chat ID: ${chatId} (type: ${typeof chatId})`);
      console.log(`   Username: ${username}`);
      console.log(`   First Name: ${firstName}`);
      console.log(`   Message text: "${update.message.text}"`);
      
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
      
      console.log('💾 Attempting database insert/update...');
      
      try {
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
        
        console.log('✅ Database operation successful!');
        console.log('   Result:', result.rows[0]);
        
        // Verify the insert with a fresh query
        const verify = await pool.query(
          'SELECT * FROM telegram_users WHERE username = $1',
          [username]
        );
        console.log('✅ Verification query result:', verify.rows[0]);
        
        // Get total user count
        const countResult = await pool.query('SELECT COUNT(*) as total FROM telegram_users');
        console.log('📊 Total users in database:', countResult.rows[0].total);
        
      } catch (dbError) {
        console.error('❌ Database error occurred:');
        console.error('   Type:', dbError instanceof Error ? dbError.constructor.name : 'Unknown');
        console.error('   Message:', dbError instanceof Error ? dbError.message : 'Unknown error');
        console.error('   Code:', (dbError as { code?: string })?.code);
        console.error('   Detail:', (dbError as { detail?: string })?.detail);
        console.error('   Constraint:', (dbError as { constraint?: string })?.constraint);
        
        // Send error message to user
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
      
      // Send welcome message
      console.log('📤 Sending welcome message...');
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      console.log('   Bot token available:', !!botToken);
      
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
          console.log('📤 Welcome message response:', responseData);
          
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
      console.log('📝 Non-/start message received:');
      console.log('   Text:', update.message?.text || 'No text');
      console.log('   Message type:', update.message ? 'message' : Object.keys(update).filter(k => k !== 'update_id')[0] || 'unknown');
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