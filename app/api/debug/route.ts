import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const hasSecret = !!process.env.STRAVA_CLIENT_SECRET;
    const hasToken = !!process.env.STRAVA_REFRESH_TOKEN;

    if (!clientId || !hasSecret || !hasToken) {
      return NextResponse.json(
        {
          status: 'missing_credentials',
          details: {
            client_id: clientId ? '✓ set' : '✗ missing',
            client_secret: hasSecret ? '✓ set' : '✗ missing',
            refresh_token: hasToken ? '✓ set' : '✗ missing',
          },
          instructions:
            'Update .env.local with valid Strava credentials from https://www.strava.com/settings/api',
        },
        { status: 400 }
      );
    }

    // Try to refresh the token
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: process.env.STRAVA_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          status: 'token_refresh_failed',
          error: data.message || data.errors?.[0]?.message || 'Unknown error',
          hint: 'Check that your Client ID, Client Secret, and Refresh Token are valid',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Token refresh successful',
      token_expires_in: data.expires_in,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
