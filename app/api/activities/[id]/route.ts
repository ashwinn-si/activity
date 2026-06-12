import { stravaFetch } from '@/lib/strava';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [activity, streams] = await Promise.all([
      stravaFetch(`/activities/${id}`),
      stravaFetch(
        `/activities/${id}/streams?keys=time,distance,heartrate,velocity_smooth,altitude,cadence&key_by_type=true`
      ),
    ]);

    return NextResponse.json({ activity, streams });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
