# Deployment Guide

## Environment Variables Required

Make sure to set these environment variables in your deployment platform:

### Required
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/solcial
JWT_SECRET=<generate-strong-secret>
ENCRYPTION_KEY=<generate-32-byte-hex>
```

### Optional (with defaults)
```
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
PORT=3000
NODE_ENV=production
```

## Generate Secrets

### JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Encryption Key (32 bytes)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deployment Platforms

### Railway
1. Connect GitHub repository
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

### Render
1. Create new Web Service
2. Connect GitHub repository
3. Build Command: `pnpm install && pnpm run build`
4. Start Command: `pnpm run start:prod`
5. Add environment variables

### Heroku
```bash
heroku create solcial-backend
heroku addons:create mongolab:sandbox
heroku config:set JWT_SECRET=<your-secret>
heroku config:set ENCRYPTION_KEY=<your-key>
git push heroku main
```

### Vercel (Serverless)
Not recommended for this app due to WebSocket and long-running processes.

## MongoDB Setup

### MongoDB Atlas (Recommended)
1. Create free cluster at mongodb.com/cloud/atlas
2. Create database user
3. Whitelist IP addresses (0.0.0.0/0 for all)
4. Get connection string
5. Replace `<password>` and `<dbname>` in connection string

### Connection String Format
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
```

## Pre-Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] IP whitelist configured
- [ ] JWT_SECRET generated and set
- [ ] ENCRYPTION_KEY generated and set
- [ ] MONGODB_URI set with correct credentials
- [ ] SOLANA_RPC_URL set (use paid RPC for production)
- [ ] NODE_ENV set to 'production'
- [ ] Build succeeds locally: `pnpm run build`
- [ ] Tests pass: `pnpm run test`

## Post-Deployment

### Test Health Endpoint
```bash
curl https://your-api.com/api/health
```

### Test Auth Endpoint
```bash
curl -X POST https://your-api.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'
```

## Common Issues

### Build Fails
- Check Node.js version (18+ required)
- Run `pnpm install` to ensure all dependencies are installed
- Check for TypeScript errors: `pnpm run build`

### MongoDB Connection Fails
- Verify connection string format
- Check database user credentials
- Ensure IP whitelist includes deployment server IP
- Test connection string locally

### Solana RPC Fails
- Use reliable RPC provider (Helius, QuickNode, Alchemy)
- Check RPC URL is correct
- Verify network (devnet/mainnet-beta)

### Environment Variables Not Loading
- Ensure .env file is not in .gitignore for local dev
- Set environment variables in deployment platform dashboard
- Restart deployment after adding variables

## Monitoring

### Logs
```bash
# Railway
railway logs

# Render
# View in dashboard

# Heroku
heroku logs --tail
```

### Health Check
Set up monitoring to ping `/api/health` every 5 minutes.

## Scaling

### Database
- Upgrade MongoDB Atlas tier
- Add read replicas
- Enable sharding for large datasets

### API
- Enable horizontal scaling in platform
- Add Redis for caching
- Use CDN for static assets

## Security

### Production Checklist
- [ ] Strong JWT_SECRET (64+ characters)
- [ ] Secure ENCRYPTION_KEY (32 bytes hex)
- [ ] HTTPS enabled
- [ ] CORS configured for frontend domain only
- [ ] Rate limiting enabled
- [ ] MongoDB user has minimal permissions
- [ ] Environment variables secured
- [ ] Logs don't expose sensitive data

## Rollback

If deployment fails:
```bash
# Railway
railway rollback

# Heroku
heroku rollback

# Render
# Use dashboard to rollback to previous deploy
```

## Support

For deployment issues:
1. Check logs for specific error
2. Verify all environment variables are set
3. Test MongoDB connection
4. Test Solana RPC connection
5. Check build output for errors
