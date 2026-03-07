import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'mail.coreskool.xyz',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: 'support@coreskool.xyz',
        pass: 'ysa+ty}=vm9Se_Jd',
      },
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email service connection failed:', error);
      } else {
        this.logger.log('Email service is ready to send emails');
      }
    });
  }

  async sendVerificationEmail(email: string, code: string, username: string) {
    try {
      const info = await this.transporter.sendMail({
        from: '"Solcial" <support@coreskool.xyz>',
        to: email,
        subject: 'Verify Your Email - Solcial',
        html: this.getVerificationEmailTemplate(code, username),
      });

      this.logger.log(`Verification email sent to ${email}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, username: string, walletAddress: string) {
    try {
      const info = await this.transporter.sendMail({
        from: '"Solcial" <support@coreskool.xyz>',
        to: email,
        subject: 'Welcome to Solcial! 🎉',
        html: this.getWelcomeEmailTemplate(username, walletAddress),
      });

      this.logger.log(`Welcome email sent to ${email}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      // Don't throw - welcome email is not critical
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(email: string, resetCode: string, username: string) {
    try {
      const info = await this.transporter.sendMail({
        from: '"Solcial" <support@coreskool.xyz>',
        to: email,
        subject: 'Reset Your Password - Solcial',
        html: this.getPasswordResetEmailTemplate(resetCode, username),
      });

      this.logger.log(`Password reset email sent to ${email}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  private getVerificationEmailTemplate(code: string, username: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Solcial</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Hi ${username}! 👋</h2>
                      <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
                        Thanks for signing up for Solcial! To complete your registration, please verify your email address using the code below:
                      </p>
                      
                      <!-- Verification Code -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 24px 0;">
                            <div style="background-color: #f3f4f6; border: 2px dashed #9333ea; border-radius: 8px; padding: 24px; display: inline-block;">
                              <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                              <p style="color: #9333ea; margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</p>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; margin: 24px 0 0 0; font-size: 14px; line-height: 1.5;">
                        This code will expire in <strong>10 minutes</strong>. If you didn't request this code, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                        © 2026 Solcial. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private getWelcomeEmailTemplate(username: string, walletAddress: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Solcial</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 32px; font-weight: 600;">🎉 Welcome to Solcial!</h1>
                      <p style="color: #e9d5ff; margin: 0; font-size: 16px;">Your social payment journey starts here</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Hi ${username}! 👋</h2>
                      <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
                        Your account is now verified and ready to use! We've automatically created a Solana wallet for you and added 2 SOL to get you started on devnet.
                      </p>
                      
                      <!-- Wallet Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                        <tr>
                          <td>
                            <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Your Wallet Address:</p>
                            <p style="color: #9333ea; margin: 0; font-size: 14px; font-family: 'Courier New', monospace; word-break: break-all;">${walletAddress}</p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Features -->
                      <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">What you can do:</h3>
                      <ul style="color: #6b7280; margin: 0 0 24px 0; padding-left: 20px; font-size: 16px; line-height: 1.8;">
                        <li>Send and receive SOL payments instantly</li>
                        <li>Chat with friends and send payments in conversations</li>
                        <li>Scan QR codes for quick payments</li>
                        <li>Share your wallet address to receive funds</li>
                        <li>View your transaction history</li>
                      </ul>
                      
                      <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.5;">
                        Need help? Check out our Help & Support section in the app or reply to this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                        © 2026 Solcial. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private getPasswordResetEmailTemplate(resetCode: string, username: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Solcial</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Hi ${username}! 👋</h2>
                      <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
                        We received a request to reset your password. Use the code below to proceed:
                      </p>
                      
                      <!-- Reset Code -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 24px 0;">
                            <div style="background-color: #f3f4f6; border: 2px dashed #9333ea; border-radius: 8px; padding: 24px; display: inline-block;">
                              <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Reset Code</p>
                              <p style="color: #9333ea; margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${resetCode}</p>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; margin: 24px 0 0 0; font-size: 14px; line-height: 1.5;">
                        This code will expire in <strong>10 minutes</strong>. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                        © 2026 Solcial. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }
}
