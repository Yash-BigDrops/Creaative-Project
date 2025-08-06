const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_R5eKDZ4gdAsk@ep-winter-wind-aehcpswx-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAndCreateTables() {
  try {
    
    const submissionsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'submissions'
      )
    `);
        
    const creativeFilesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'creative_files'
      )
    `);
    
    const submissionsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'submissions' 
      ORDER BY ordinal_position
    `);
    
    submissionsStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    const creativeFilesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'creative_files' 
      ORDER BY ordinal_position
    `);
    
    creativeFilesStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    const submissionsCount = await pool.query('SELECT COUNT(*) as count FROM submissions');
    
    const creativeFilesCount = await pool.query('SELECT COUNT(*) as count FROM creative_files');
    
    const recentSubmissions = await pool.query(`
      SELECT id, offer_id, contact_info, from_lines, subject_lines, created_at 
      FROM submissions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (recentSubmissions.rows.length === 0) {
    } else {
      recentSubmissions.rows.forEach((sub, index) => {
        console.log(`${index + 1}. ID: ${sub.id}, Offer: ${sub.offer_id}, Contact: ${sub.contact_info}`);
        console.log(`   From Lines: ${sub.from_lines ? 'Yes' : 'No'}, Subject Lines: ${sub.subject_lines ? 'Yes' : 'No'}`);
        console.log(`   Created: ${sub.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database schema check failed:', error);
  } finally {
    await pool.end();
  }
}

checkAndCreateTables(); 