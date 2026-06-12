import { stravaFetch } from '@/lib/strava';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const athlete = await stravaFetch('/athlete');
    const stats = await stravaFetch(`/athletes/${athlete.id}/stats`);
    return NextResponse.json({ athlete, stats });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
