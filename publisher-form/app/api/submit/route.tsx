import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { sendEmail, createSubmissionEmail } from '@/lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const formData = await request.formData();
  const offerId = formData.get('offerId') as string;
  const creativeUrls = formData.getAll('creativeUrls') as string[];
  const contactEmail = formData.get('contactEmail') as string;

  if (!offerId || creativeUrls.length === 0 || !contactEmail) {
    return NextResponse.json({ error: 'Offer ID, creative URLs, and an email address are required.' }, { status: 400 });
  }

  const primaryUrl = creativeUrls[0];
  const fileName = `${offerId}_creative`;
  const originalFilename = `creative_${Date.now()}`;

  try {
    const telegramId = formData.get('telegramId') as string | null;
    const fromLine = formData.get('fromLine') as string | null;
    const subjectLines = formData.get('subjectLines') as string | null;
    const otherRequest = formData.get('otherRequest') as string | null;
    const priority = formData.get('priority') as string | null;

    const submissionResult = await sql`
      INSERT INTO submissions (
        offer_id, file_url, file_key, original_filename, 
        contact_method, contact_info, telegram_chat_id,
        from_lines, subject_lines, other_request, priority
      )
      VALUES (
        ${offerId}, ${primaryUrl}, ${fileName}, ${originalFilename}, 
        'email', ${contactEmail}, ${telegramId},
        ${fromLine}, ${subjectLines}, ${otherRequest}, ${priority}
      )
      RETURNING id;
    `;

    const newSubmissionId = submissionResult.rows[0].id;
    const trackingLink = `https://www.bigdropsmarketing.com/tracking_link/BDMG${newSubmissionId}`;


    const EVERFLOW_API_KEY = process.env.EVERFLOW_API_KEY;

    if (EVERFLOW_API_KEY && offerId) {
      try {
        const everflowApiUrl = `https://api.eflow.team/v1/networks/offers/${offerId}`;
        const response = await fetch(everflowApiUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'X-Eflow-API-Key': EVERFLOW_API_KEY },
          cache: 'no-store',
        });
        if (response.ok) {
          await response.json();
        }
      } catch (e) {
      }
    }

    if (contactEmail) {
      try {
        const contactName = formData.get('firstName') as string || 'there';
        
        const emailHtml = createSubmissionEmail({
          contactName,
          priority: priority || 'Moderate',
          trackingLink,
        });
        
        const emailResult = await sendEmail({
          to: contactEmail,
          subject: 'Your Submission Has Been Received!',
          html: emailHtml,
        });
        
        if (emailResult.success) {
        } else {
        }
      } catch (exception) {
      }
    }

    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

    if (telegramBotToken && telegramId && telegramId.trim() !== '') {
      console.log('📱 Telegram notification requested for user:', telegramId);
      try {
        const username = telegramId.trim().replace(/^@/, ''); 
        console.log('🔍 Looking up user in database:', username);
        
        const result = await sql`
          SELECT chat_id, first_name 
          FROM telegram_users 
          WHERE username = ${username}
        `;
        
        if (result.rows.length === 0) {
          console.log('❌ User not found in database:', username);
        } else {
          const user = result.rows[0];
          const chatId = user.chat_id;
          console.log('✅ User found, chat ID:', chatId);
          
          const userMessage = `
<b>Your Submission Has Been Received!</b>
-----------------------------------
<b>Affiliate ID:</b> ${formData.get("affiliateId")}
<b>Company:</b> ${formData.get("companyName")}
<b>Name:</b> ${formData.get("firstName")} ${formData.get("lastName")}
<b>Offer ID:</b> ${offerId}
<b>Email:</b> ${contactEmail}
<b>Priority:</b> ${priority || "Moderate"}
-----------------------------------
<b>Tracking Link:</b> ${trackingLink}

You can use this link to track the status of your submission.
          `;
          
          console.log('📤 Sending Telegram notification to chat ID:', chatId);
          const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
          const response = await fetch(telegramApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: userMessage,
              parse_mode: "HTML",
            }),
          });
          
          const responseData = await response.json();
          console.log('📤 Telegram API response:', responseData);
          
          if (response.ok && responseData.ok) {
            console.log('✅ Telegram notification sent successfully');
          } else {
            console.log('❌ Failed to send Telegram notification:', responseData.description);
            if (responseData.error_code === 400 && responseData.description.includes("chat not found")) {
              console.log('💡 Chat not found - user may have blocked the bot or deleted the chat');
            }
          }
        }
      } catch (exception) {
        console.log('❌ Error sending Telegram notification:', exception);
      }
    } else if (telegramBotToken) {
      console.log('📱 No Telegram ID provided, skipping notification');
    } else {
      console.log('📱 Telegram bot token not configured');
    }

    return NextResponse.json({ success: true, url: primaryUrl, trackingLink: trackingLink });

  } catch (error) {
    return NextResponse.json({ error: 'Server error during submission.' }, { status: 500 });
  }
}