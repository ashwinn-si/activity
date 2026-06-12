# Getting Strava API Credentials

## Step 1: Create a Strava Account

If you don't have one, sign up at https://www.strava.com

## Step 2: Create an API Application

1. Go to https://www.strava.com/settings/api
2. Fill out the app creation form:
   - **Application Name**: "Strava Dashboard" (or whatever you prefer)
   - **Category**: "Training"
   - **Website**: http://localhost:3000 (or your domain)
   - **Application Description**: "Personal activity dashboard"
   - **Authorization Callback Domain**: localhost (for local dev) or your domain

3. Click **Create**. You'll see:
   - **Client ID** — copy this
   - **Client Secret** — copy this (keep it secret!)

## Step 3: Get Your Refresh Token

You need to complete the OAuth flow once to get a refresh token.

### Option A: Using the Browser (Easiest)

1. Visit this URL in your browser (replace `YOUR_CLIENT_ID`):

```
https://www.strava.com/oauth/authorize?client_id=43ee27de389df79d1c70119ad9bceb07327e355a&response_type=code&redirect_uri=http://localhost:3000&scope=activity:read_all
```

2. Strava will ask for permission. Click **Authorize**.

3. You'll be redirected to `http://localhost:3000?code=XXXX...`. Copy the `code` value from the URL.

4. Run this in terminal (replace values):

```bash
curl -X POST https://www.strava.com/oauth/token \
  -d client_id=YOUR_CLIENT_ID \
  -d client_secret=YOUR_CLIENT_SECRET \
  -d code=AUTHORIZATION_CODE \
  -d grant_type=authorization_code
```

5. The response will include `refresh_token`. Copy it.

### Option B: Using Strava's Test Token (Simpler for Testing)

If you just want to test the app, Strava provides a test athlete:

1. Go back to https://www.strava.com/settings/api
2. Scroll down to "Your Access Token"
3. You'll see a test access token and refresh token already generated
4. Use those for development

## Step 4: Update `.env.local`

```env
STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here
STRAVA_REFRESH_TOKEN=your_refresh_token_here
```

## Step 5: Verify It Works

1. Restart the dev server: `npm run dev`
2. Visit http://localhost:3000/api/debug
   - Should see `"status": "ok"` if credentials are valid
3. Go to http://localhost:3000
   - Dashboard should load with your activities

## Troubleshooting

**"Authorization Error"**

- Client ID, Secret, or Refresh Token is invalid
- Token may have expired (refresh tokens expire after 6 months of non-use)
- Get a new one by repeating the OAuth flow

**"Invalid Client"**

- Check that Client ID and Secret match your app from the Strava API settings

**"Invalid Redirect URI"**

- When doing OAuth, the redirect domain must match what you registered

**Activities showing but no data**

- Strava API returns recent activities first; if you have no recent activities, the list will be empty
- Activities older than 5 years may not be available via API

---

## Security Notes

- **Never** commit `.env.local` to git (it's in `.gitignore`)
- **Never** share your Client Secret publicly
- The dashboard stores credentials server-side only
- Your browser never sees your credentials—only JSON data

---

Once you have valid credentials, the dashboard will:

- Load your athlete profile
- Display recent activities with stats
- Show weekly volume charts
- Provide activity details with pace/elevation/HR data
- Aggregate yearly and all-time statistics
