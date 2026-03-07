/**
 * Test script for email service
 * Run with: npx tsx test-email.ts
 */

import * as nodemailer from 'nodemailer';

async function testEmail() {
  console.log('🔍 Testing Email Service...');
  console.log('================================\n');

  const transporter = nodemailer.createTransport({
    host: 'mail.coreskool.xyz',
    port: 465,
    secure: true,
    auth: {
      user: 'support@coreskool.xyz',
      pass: 'ysa+ty}=vm9Se_Jd',
    },
  });

  try {
    // Verify connection
    console.log('1️⃣ Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    // Send test email
    console.log('2️⃣ Sending test email...');
    const info = await transporter.sendMail({
      from: '"Solcial" <support@coreskool.xyz>',
      to: 'support@coreskool.xyz', // Send to self for testing
      subject: 'Test Email - Solcial',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from Solcial backend.</p>
        <p>If you receive this, the email service is working correctly!</p>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\n✅ All tests passed! Email service is ready.');
  } catch (error) {
    console.error('❌ Email test failed:', error);
    process.exit(1);
  }
}

testEmail();
