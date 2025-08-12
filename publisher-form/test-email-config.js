require('dotenv').config({ path: '.env.development.local' });

const nodemailer = require('nodemailer');

const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password',
  },
};

async function testEmailConfig() {
  console.log('📧 Testing Email Configuration...\n');
  
  console.log('🔧 Current SMTP Configuration:');
  console.log('   Host:', emailConfig.host);
  console.log('   Port:', emailConfig.port);
  console.log('   User:', emailConfig.auth.user);
  console.log('   Pass:', emailConfig.auth.pass ? '***' + emailConfig.auth.pass.slice(-4) : 'NOT SET');
  
  const transporter = nodemailer.createTransport(emailConfig);
  
  try {
    console.log('\n🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    
    console.log('\n📤 Testing email sending...');
    const testMailOptions = {
      from: `"Big Drops Marketing Test" <${emailConfig.auth.user}>`,
      to: emailConfig.auth.user, // Send to yourself for testing
      subject: '🧪 Email Configuration Test',
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email to verify that your SMTP configuration is working correctly.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>SMTP Host:</strong> ${emailConfig.host}</p>
        <p><strong>SMTP Port:</strong> ${emailConfig.port}</p>
        <p>If you receive this email, your email configuration is working! 🎉</p>
      `
    };
    
    const info = await transporter.sendMail(testMailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('📋 Message ID:', info.messageId);
    console.log('📧 Email sent to:', testMailOptions.to);
    
  } catch (error) {
    console.log('❌ Email configuration error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Gmail Authentication Issues:');
      console.log('1. Enable 2-Factor Authentication on your Google account');
      console.log('2. Generate an App Password:');
      console.log('   - Go to https://myaccount.google.com/apppasswords');
      console.log('   - Select "Mail" and your device');
      console.log('   - Use the generated 16-character password');
      console.log('3. Update your .env.development.local file:');
      console.log('   SMTP_PASS="your-16-character-app-password"');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🔧 Connection Issues:');
      console.log('1. Check your internet connection');
      console.log('2. Verify SMTP_HOST and SMTP_PORT are correct');
      console.log('3. Try using port 465 with secure: true');
    }
  }
}

testEmailConfig();
