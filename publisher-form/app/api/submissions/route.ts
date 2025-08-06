import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { sendEmail, createSubmissionEmail } from '@/lib/emailService';

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

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const {
      offer_id,
      priority,
      contact_method,
      contact_info,
      from_lines,
      subject_lines,
      other_request,
      creatives
    } = await request.json();



    if (!offer_id || !contact_info || !creatives || creatives.length === 0) {
      return NextResponse.json({ 
        error: 'Offer ID, contact info, and at least one creative are required.' 
      }, { status: 400 });
    }

    const pool = getPool();
    
    
    const submissionResult = await pool.query(
      `INSERT INTO submissions (
        offer_id, priority, contact_method, contact_info, 
        from_lines, subject_lines, other_request
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [offer_id, priority, contact_method, contact_info, from_lines, subject_lines, other_request]
    );

    const submissionId = submissionResult.rows[0].id;
    const trackingLink = `https://www.bigdropsmarketing.com/tracking_link/BDMG${submissionId}`;

    for (const creative of creatives) {
      await pool.query(
        `INSERT INTO creative_files (
          submission_id, file_url, file_key, original_filename, 
          creative_from_lines, creative_subject_lines, creative_notes, creative_html_code
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          submissionId, 
          creative.file_url, 
          creative.file_key, 
          creative.original_filename, 
          creative.creative_from_lines, 
          creative.creative_subject_lines, 
          creative.creative_notes, 
          creative.creative_html_code
        ]
      );
    }

    if (contact_info) {
      try {
        const emailHtml = createSubmissionEmail({
          contactName: 'there',
          priority: priority || 'Moderate',
          trackingLink,
        });
        
        const emailResult = await sendEmail({
          to: contact_info,
          subject: 'Your Submission Has Been Received!',
          html: emailHtml,
        });
        
        if (emailResult.success) {
        } else {
        }
      } catch (exception) {
      }
    }

    await pool.end();
    
    return NextResponse.json({ 
      success: true, 
      submissionId,
      trackingLink 
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error during submission.' 
    }, { status: 500 });
  }
} 