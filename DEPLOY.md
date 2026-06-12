# Deploying to Vercel with Custom Domain

Complete guide to deploy Strava Dashboard to Vercel with your custom domain `activity.ashwinsi.in`.

## Prerequisites

- Vercel account (free at https://vercel.com)
- GitHub account (to connect your repo)
- Custom domain registered (you already have `activity.ashwinsi.in`)
- Strava API credentials with correct OAuth settings

## Step 1: Prepare Your Project for Vercel

### 1.1 Initialize Git (if not already done)

```bash
cd /Users/ashwinsi/projects/activity
git status
```

If `.git` doesn't exist:
```bash
git init
git add .
git commit -m "Initial commit: Strava Dashboard"
```

### 1.2 Push to GitHub

```bash
# Create repo on GitHub first at github.com/new
# Then:
git remote add origin https://github.com/YOUR_USERNAME/activity.git
git branch -M main
git push -u origin main
```

## Step 2: Create Vercel Project

### 2.1 Connect Vercel to GitHub

1. Go to https://vercel.com
2. Click **"New Project"**
3. Select **"Import Git Repository"**
4. Connect your GitHub account
5. Select the `activity` repository
6. Click **"Import"**

### 2.2 Configure Project Settings

**Framework**: Next.js (auto-detected)

**Environment Variables**: Skip for now, we'll add after domain setup

**Root Directory**: `.` (default)

Click **"Deploy"** to create the project

## Step 3: Add Custom Domain to Vercel

### 3.1 Connect Domain in Vercel

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Domains"**
3. Click **"Add"**
4. Enter your domain: `activity.ashwinsi.in`
5. Click **"Add"**

### 3.2 Configure DNS Records

Vercel will show you 2 options. **Choose Option 1: Nameservers** (recommended)

Copy the nameservers provided:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
ns3.vercel-dns.com
ns4.vercel-dns.com
```

### 3.3 Update Domain Registrar

1. Log in to where you registered `activity.ashwinsi.in`
2. Find **DNS Settings** or **Nameservers**
3. Replace existing nameservers with Vercel's 4 nameservers
4. Save changes

**⏳ Wait 24-48 hours** for DNS to propagate (usually 10 mins - 2 hours)

Verify DNS is live:
```bash
nslookup activity.ashwinsi.in
# Should show Vercel's nameservers
```

## Step 4: Update Strava OAuth Settings

⚠️ **IMPORTANT**: Update BEFORE adding env vars to Vercel

### 4.1 Update OAuth Redirect URL

1. Go to https://www.strava.com/settings/api
2. Click on your app
3. Update **"Authorization Callback Domain"** to: `activity.ashwinsi.in`
4. Update **"Website"** to: `https://activity.ashwinsi.in`
5. Save

### 4.2 Get New Refresh Token

Since you changed the OAuth domain, you need a new refresh token:

1. Visit this URL in your browser (replace with your Client ID):
```
https://www.strava.com/oauth/authorize?client_id=257631&response_type=code&redirect_uri=https://activity.ashwinsi.in&scope=activity:read_all
```

2. Click **"Authorize"**

3. You'll be redirected to: `https://activity.ashwinsi.in?code=XXXXX...`

4. Copy the **code** from the URL

5. Run in terminal:
```bash
curl -X POST https://www.strava.com/oauth/token \
  -d client_id=257631 \
  -d client_secret=43ee27de389df79d1c70119ad9bceb07327e355a \
  -d code=<PASTE_CODE_HERE> \
  -d grant_type=authorization_code
```

6. Copy the **refresh_token** from the response

## Step 5: Add Environment Variables to Vercel

### 5.1 Set Env Vars in Vercel

1. Go to your Vercel project
2. Click **"Settings"** → **"Environment Variables"**
3. Add three variables:

| Name | Value |
|------|-------|
| `STRAVA_CLIENT_ID` | `257631` |
| `STRAVA_CLIENT_SECRET` | Your client secret |
| `STRAVA_REFRESH_TOKEN` | Your **NEW** refresh token from Step 4 |

Click **"Save"** for each variable

### 5.2 Redeploy with New Variables

1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click the **"..."** menu → **"Redeploy"**
4. Confirm

⏳ Wait for redeployment to complete

## Step 6: Verify Everything Works

### 6.1 Test the Domain

1. Wait for DNS to propagate (check with `nslookup` from Step 3.3)
2. Visit https://activity.ashwinsi.in
3. Check if your activities load

### 6.2 Debug Endpoint

If issues occur, check:
```bash
curl https://activity.ashwinsi.in/api/debug
```

Should return:
```json
{
  "status": "ok",
  "message": "Token refresh successful",
  "token_expires_in": 21600
}
```

If you get "Authorization Error", refresh token is wrong. Repeat Step 4.2.

## Step 7: Update Local `.env.local` (Optional)

For local development, you can keep using localhost OR update to production domain:

```env
STRAVA_CLIENT_ID=257631
STRAVA_CLIENT_SECRET=43ee27de389df79d1c70119ad9bceb07327e355a
STRAVA_REFRESH_TOKEN=your_new_refresh_token
```

Then run:
```bash
npm run dev
```

## Troubleshooting

### Domain not working
- ✅ Check DNS propagated: `nslookup activity.ashwinsi.in`
- ✅ Vercel shows green checkmark on domain
- ✅ Wait up to 48 hours for DNS

### "Authorization Error" on /api/debug
- ✅ Refresh token from Step 4.2 is wrong
- ✅ Strava OAuth domain not updated to `activity.ashwinsi.in`
- ✅ Environment variables not redeployed
- ✅ Try Step 4.2 again with correct domain

### Activities not loading
- ✅ Run `/api/debug` endpoint first
- ✅ Check network tab in browser DevTools
- ✅ Check Vercel function logs for errors

### SSL Certificate Issues
- Vercel handles this automatically
- May take a few minutes after domain is added
- If persists, wait 24 hours for DNS propagation

## Monitoring & Updates

### View Logs
1. Vercel dashboard → **"Functions"**
2. Check API route logs for errors

### Check Deployments
1. Vercel dashboard → **"Deployments"**
2. Click latest deployment to see build output

### Update Code
After making changes locally:
```bash
git add .
git commit -m "Update: description of changes"
git push origin main
```

Vercel automatically redeploys on push to `main`!

## Final Checklist

- ✅ Project pushed to GitHub
- ✅ Vercel project created & linked
- ✅ Custom domain added to Vercel
- ✅ Nameservers updated at registrar
- ✅ DNS verified with `nslookup`
- ✅ Strava OAuth domain updated
- ✅ New refresh token obtained
- ✅ Environment variables set in Vercel
- ✅ Project redeployed
- ✅ https://activity.ashwinsi.in working
- ✅ `/api/debug` returns "ok"

## Live!

Your Strava Dashboard is now live at:
### 🚀 https://activity.ashwinsi.in

Share with friends! Track activities in style! 📊🚴‍♂️🏃‍♀️
