let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60_000) return cachedToken;

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = data.expires_at * 1000;
  return cachedToken;
}

export async function stravaFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(`https://www.strava.com/api/v3${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Strava API error: ${res.status}`);
  return res.json();
}
