import { stravaFetch } from '@/lib/strava';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || 1;
    const perPage = searchParams.get('per_page') || 30;

    const activities = await stravaFetch(
      `/athlete/activities?page=${page}&per_page=${perPage}`
    );
    return NextResponse.json(activities);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
