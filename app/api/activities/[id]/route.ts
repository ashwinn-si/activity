import { stravaFetch } from '@/lib/strava';
import { connectDB } from '@/lib/mongodb';
import { ActivityDetailCache } from '@/models/ActivityDetailCache';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const stravaId = parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (!force) {
      const cached = await ActivityDetailCache.findOne({ stravaId }).lean();
      if (cached) {
        return NextResponse.json({ activity: cached.activity, streams: cached.streams });
      }
    }

    const [activity, streams] = await Promise.all([
      stravaFetch(`/activities/${id}`),
      stravaFetch(
        `/activities/${id}/streams?keys=time,distance,heartrate,velocity_smooth,altitude,cadence&key_by_type=true`
      ),
    ]);

    await ActivityDetailCache.updateOne(
      { stravaId },
      { $set: { stravaId, activity, streams } },
      { upsert: true }
    );

    return NextResponse.json({ activity, streams });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
