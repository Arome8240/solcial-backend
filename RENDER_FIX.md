# Render Deployment Fix

## Problem
The error `Cannot find module '/opt/render/project/src/dist/main'` means the TypeScript code wasn't compiled to JavaScript before running.

## Solution

### Option 1: Update Render Dashboard (Recommended)

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your `solcial-backend` service
3. Go to "Settings" tab
4. Update the following:

**Build Command:**
```bash
pnpm install && pnpm run build
```

**Start Command:**
```bash
pnpm run start:prod
```

5. Click "Save Changes"
6. Go to "Manual Deploy" and click "Deploy latest commit"

### Option 2: Use render.yaml (Automatic)

I've created a `render.yaml` file in the root of your backend. This will automatically configure Render:

1. Commit and push the `render.yaml` file:
```bash
cd solcial-backend
git add render.yaml
git commit -m "Add Render configuration"
git push
```

2. Render will automatically detect and use this configuration

### Option 3: Manual Build Locally (Testing)

To test the build locally:

```bash
cd solcial-backend

# Install dependencies
pnpm install

# Build the project
pnpm run build

# Check if dist folder was created
ls -la dist/

# Run production build
pnpm run start:prod
```

## Verification

After deploying, verify the build worked:

1. Check Render logs for build output
2. Look for: "Build successful" or similar message
3. Test the API:
```bash
curl https://solcial-backend.onrender.com/api/health
```

## Common Issues

### Issue: Build fails with TypeScript errors
**Solution:** Fix TypeScript errors locally first, then redeploy

### Issue: pnpm not found
**Solution:** Render should auto-detect pnpm from package.json. If not, change commands to use `npm` instead:
- Build: `npm install && npm run build`
- Start: `npm run start:prod`

### Issue: Out of memory during build
**Solution:** Upgrade to a paid Render plan or optimize build process

### Issue: Environment variables not set
**Solution:** Verify all required env vars are set in Render dashboard:
- MONGODB_URI
- JWT_SECRET
- ENCRYPTION_KEY
- SOLANA_RPC_URL
- SOLANA_NETWORK

## Expected Build Output

You should see something like this in Render logs:

```
==> Installing dependencies
==> Running 'pnpm install'
Packages: +XXX
Progress: resolved XXX, reused XXX, downloaded X, added XXX
Done in Xs

==> Running 'pnpm run build'
> solcial-backend@0.0.1 build
> nest build

Build successful

==> Starting service
> solcial-backend@0.0.1 start:prod
> node dist/main

[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [InstanceLoader] MongooseModule dependencies initialized
[Nest] INFO [InstanceLoader] ConfigModule dependencies initialized
...
[Nest] INFO [NestApplication] Nest application successfully started
```

## Quick Fix Steps

1. **Go to Render Dashboard**
2. **Settings → Build Command:** `pnpm install && pnpm run build`
3. **Settings → Start Command:** `pnpm run start:prod`
4. **Save Changes**
5. **Manual Deploy → Deploy latest commit**
6. **Wait for build to complete (2-5 minutes)**
7. **Test:** `curl https://solcial-backend.onrender.com/api/health`

## Need Help?

If the issue persists:
1. Check Render logs for specific error messages
2. Verify all environment variables are set
3. Try building locally to identify TypeScript errors
4. Check that `dist/main.js` exists after build
