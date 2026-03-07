# Deployment Troubleshooting Guide

## Common Deployment Errors

### 1. Build Fails

#### Error: "Cannot find module"
**Solution:**
```bash
# Ensure all dependencies are installed
pnpm install

# Check if package.json has all required dependencies
pnpm list
```

#### Error: TypeScript compilation errors
**Solution:**
```bash
# Run build locally to see errors
pnpm run build

# Check TypeScript version
pnpm list typescript
```

### 2. MongoDB Connection Errors

#### Error: "MongooseServerSelectionError"
**Causes:**
- Wrong connection string
- IP not whitelisted
- Wrong credentials
- Network issues

**Solution:**
```bash
# Test connection string locally
MONGODB_URI="your-connection-string" pnpm run start:dev

# Verify connection string format:
# mongodb+srv://username:password@cluster.mongodb.net/dbname

# Check MongoDB Atlas:
# 1. Database Access -> Verify user exists
# 2. Network Access -> Add 0.0.0.0/0 (allow all IPs)
# 3. Database -> Get correct connection string
```

### 3. Environment Variables Not Set

#### Error: "JWT_SECRET is undefined"
**Solution:**
- Ensure all required env vars are set in deployment platform
- Check spelling of environment variable names
- Restart deployment after adding variables

**Required Variables:**
```
MONGODB_URI
JWT_SECRET
ENCRYPTION_KEY
```

### 4. Solana RPC Connection Fails

#### Error: "Failed to connect to Solana"
**Solution:**
```bash
# Use reliable RPC provider
SOLANA_RPC_URL=https://api.devnet.solana.com

# For production, use paid RPC:
# - Helius: https://rpc.helius.xyz/?api-key=YOUR_KEY
# - QuickNode: https://your-endpoint.quiknode.pro/YOUR_KEY
# - Alchemy: https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY
```

### 5. Port Already in Use

#### Error: "EADDRINUSE: address already in use"
**Solution:**
```bash
# Change PORT in .env
PORT=3001

# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### 6. bcrypt Build Errors

#### Error: "Error: Cannot find module 'bcrypt'"
**Solution:**
```bash
# Rebuild bcrypt
pnpm rebuild bcrypt

# Or use bcryptjs instead (pure JS, no native dependencies)
pnpm remove bcrypt
pnpm add bcryptjs
# Then update imports in code
```

### 7. Memory Issues

#### Error: "JavaScript heap out of memory"
**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm run start:prod

# Or in package.json:
"start:prod": "NODE_OPTIONS='--max-old-space-size=4096' node dist/main"
```

## Platform-Specific Issues

### Railway

#### Build fails
- Check build logs in Railway dashboard
- Ensure `pnpm-lock.yaml` is committed
- Set Node.js version in `package.json`:
```json
"engines": {
  "node": ">=18.0.0"
}
```

#### Environment variables not loading
- Add variables in Railway dashboard
- Redeploy after adding variables
- Check variable names match exactly

### Render

#### Build command not working
**Correct build command:**
```
pnpm install && pnpm run build
```

**Correct start command:**
```
pnpm run start:prod
```

#### Health check fails
- Set health check path to `/api/health`
- Ensure app starts before health check runs
- Increase health check timeout

### Heroku

#### Procfile missing
Create `Procfile`:
```
web: pnpm run start:prod
```

#### Port binding error
Heroku assigns PORT dynamically:
```typescript
// In main.ts
const port = process.env.PORT || 3000;
await app.listen(port, '0.0.0.0');
```

## Debugging Steps

### 1. Check Logs
```bash
# Railway
railway logs

# Render
# View in dashboard

# Heroku
heroku logs --tail

# Local
pnpm run start:dev
```

### 2. Test Locally
```bash
# Build
pnpm run build

# Run production build locally
pnpm run start:prod

# Test endpoints
curl http://localhost:3000/api/health
```

### 3. Verify Environment
```bash
# Check Node version
node --version  # Should be 18+

# Check pnpm version
pnpm --version

# Check dependencies
pnpm list
```

### 4. Test Database Connection
```bash
# Use mongosh to test connection
mongosh "your-connection-string"

# Or use Node.js
node -e "require('mongoose').connect('your-connection-string').then(() => console.log('Connected')).catch(e => console.error(e))"
```

### 5. Test Solana Connection
```bash
# Test RPC endpoint
curl https://api.devnet.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

## Quick Fixes

### Reset Everything
```bash
# Delete node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild
pnpm run build

# Test
pnpm run start:prod
```

### Check Build Output
```bash
# Build and check dist folder
pnpm run build
ls -la dist/

# Should contain:
# - main.js
# - All module folders
# - tsconfig.build.tsbuildinfo
```

### Verify Package.json Scripts
```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:prod": "node dist/main"
  }
}
```

## Still Having Issues?

### Checklist
- [ ] All environment variables set correctly
- [ ] MongoDB connection string is correct
- [ ] IP whitelist includes deployment server
- [ ] Build succeeds locally
- [ ] Dependencies are installed
- [ ] Node.js version is 18+
- [ ] Port is not hardcoded
- [ ] Health endpoint returns 200
- [ ] Logs show no errors

### Get Help
1. Check deployment platform status page
2. Review full error logs
3. Test each component individually
4. Compare with working deployment
5. Check platform documentation

## Prevention

### Before Deploying
```bash
# Run these commands
pnpm install
pnpm run build
pnpm run test
pnpm run start:prod

# Test health endpoint
curl http://localhost:3000/api/health

# Test auth endpoint
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"test","password":"password123"}'
```

### CI/CD Pipeline
Add these checks to your CI/CD:
1. Install dependencies
2. Run linter
3. Run tests
4. Build project
5. Check build output
6. Test health endpoint

## Success Indicators

✅ Build completes without errors
✅ Health endpoint returns 200
✅ MongoDB connection successful
✅ Solana RPC connection successful
✅ Auth endpoints work
✅ No errors in logs
✅ App stays running (doesn't crash)
