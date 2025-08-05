import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    // First, let's see what tables exist in the database
    const allTables = await pool.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name LIKE '%telegram%'
       ORDER BY table_name`
    );
    
    console.log('Tables with "telegram" in name:', allTables.rows);
    
    // Check if telegram_users table exists
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'telegram_users'
      )`
    );
    
    const tableExists = tableCheck.rows[0]?.exists;
    
    if (!tableExists) {
      // Let's check what the actual table structure is
      const actualTableName = allTables.rows[0]?.table_name;
      
      if (actualTableName) {
        const structure = await pool.query(
          `SELECT column_name, data_type, is_nullable
           FROM information_schema.columns
           WHERE table_name = $1
           ORDER BY ordinal_position`,
          [actualTableName]
        );
        
        // Get sample data from the actual table
        let sampleData: unknown[] = [];
                  try {
            if (actualTableName === 'telegram_messages') {
              const result = await pool.query(
                `SELECT * FROM telegram_messages LIMIT 10`
              );
              sampleData = result.rows;
            } else if (actualTableName === 'telegram_users') {
              const result = await pool.query(
                `SELECT * FROM telegram_users LIMIT 10`
              );
              sampleData = result.rows;
            }
          } catch (e) {
            console.log('Could not get sample data:', e);
          }
        
        return NextResponse.json({
          tableExists: false,
          actualTableName: actualTableName,
          structure: structure.rows,
          sampleData: sampleData,
          allTables: allTables.rows
        });
      }
      
      return NextResponse.json({ 
        error: 'No telegram_users table found',
        tableExists: false,
        allTables: allTables.rows
      });
    }
    
    // Get table structure
    const structure = await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'telegram_users'
       ORDER BY ordinal_position`
    );
    
    // Get all users
    const users = await pool.query(
      `SELECT username, chat_id, first_name, created_at, updated_at
       FROM telegram_users
       ORDER BY created_at DESC`
    );
    
    return NextResponse.json({
      tableExists: true,
      structure: structure.rows,
      users: users.rows,
      userCount: users.rows.length
    });
    
  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      tableExists: false 
    }, { status: 500 });
  }
} 