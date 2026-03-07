# Deploy to Render - Quick Fix

## The Problem
Your backend deployment failed because the build step wasn't configured. The error was:
```
Cannot find module '/opt/render/project/src/dist/main'
```

## The Fix (3 Steps)

### Step 1: Update Render Settings

Go to https://dashboard.render.com and select your `solcial-backend` service.

Click **Settings** and update:

**Build Command:**
```
pnpm install && pnpm run build
```

**Start Command:**
```
pnpm run start:prod
```

Click **Save Changes**.

### Step 2: Commit and Push Changes

I've updated the `package.json` to fix the start command. Commit and push:

```bash
cd solcial-backend
git add package.json render.yaml
git commit -m "fix: update start command for Render deployment"
git push
```

### Step 3: Deploy

In Render dashboard:
1. Go to your service
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait 2-5 minutes for build to complete

## Verify Deployment

Once deployed, test the API:

```bash
# Health check
curl https://solcial-backend.onrender.com/api/health

# Should return:
# {"status":"ok","timestamp":"...","uptime":...}
```

## What Changed?

1. **package.json**: Updated `start:prod` script from `node dist/main` to `node dist/src/main`
   - NestJS builds to `dist/src/` not `dist/`
   
2. **render.yaml**: Added configuration file for automatic Render setup

## If It Still Fails

Check Render logs for:
- TypeScript compilation errors
- Missing environment variables
- MongoDB connection issues

Make sure these environment variables are set in Render:
- ✅ MONGODB_URI
- ✅ JWT_SECRET
- ✅ ENCRYPTION_KEY
- ✅ SOLANA_RPC_URL
- ✅ SOLANA_NETWORK

## Expected Success Output

In Render logs, you should see:

```
==> Building...
> nest build
Build successful

==> Starting...
> node dist/src/main
[Nest] Starting Nest application...
[Nest] Nest application successfully started
🚀 Server running on http://localhost:3000
```

## Test Your App

Once deployed:
1. Open your mobile app
2. Try to sign up
3. Check your email for verification code
4. Complete the auth flow

Your backend is now live! 🎉
