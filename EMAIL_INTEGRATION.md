# Email Integration Guide

## Overview

Nodemailer is integrated for sending transactional emails using your SMTP server at `mail.coreskool.xyz`.

## Email Types

### 1. Verification Email
**Sent when**: User signs up
**Contains**: 6-digit verification code
**Expires**: 10 minutes

### 2. Welcome Email
**Sent when**: User verifies their email
**Contains**: 
- Welcome message
- Wallet address
- Feature overview
- Getting started tips

### 3. Password Reset Email (Future)
**Sent when**: User requests password reset
**Contains**: Reset code

## Email Templates

All emails feature:
- Beautiful HTML design with purple gradient header
- Responsive layout
- Professional branding
- Clear call-to-action
- Expiration information

## Configuration

```typescript
Host: mail.coreskool.xyz
Port: 465 (SSL)
User: support@coreskool.xyz
From: "Solcial" <support@coreskool.xyz>
```

## Testing

### Test Email Service
```bash
npx tsx test-email.ts
```

### Test Full Auth Flow
1. Sign up a new user
2. Check email inbox for verification code
3. Verify email
4. Check inbox for welcome email

## Error Handling

- If email sending fails, the code is logged to console as fallback
- Welcome emails are non-critical (won't block verification)
- All email errors are logged for debugging

## Email Service Methods

```typescript
// Send verification email
await emailService.sendVerificationEmail(email, code, username);

// Send welcome email
await emailService.sendWelcomeEmail(email, username, walletAddress);

// Send password reset email
await emailService.sendPasswordResetEmail(email, resetCode, username);
```

## Production Checklist

- [x] SMTP credentials configured
- [x] Email templates designed
- [x] Error handling implemented
- [x] Fallback logging added
- [ ] Test with real email addresses
- [ ] Monitor email delivery rates
- [ ] Set up email bounce handling
- [ ] Add unsubscribe links (if needed)

## Troubleshooting

### Emails not sending
1. Check SMTP credentials
2. Verify port 465 is not blocked
3. Check email service logs
4. Test with `test-email.ts` script

### Emails going to spam
1. Verify SPF records for coreskool.xyz
2. Set up DKIM signing
3. Configure DMARC policy
4. Use consistent "From" address

## Next Steps

1. Test email delivery with real addresses
2. Monitor email logs on Render
3. Add email templates for other features:
   - Transaction notifications
   - Security alerts
   - Account updates
