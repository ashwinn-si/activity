import { stravaFetch } from '@/lib/strava';
import { connectDB, isCacheStale } from '@/lib/mongodb';
import { Activity } from '@/models/Activity';
import { CacheMetadata } from '@/models/CacheMetadata';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const meta = await CacheMetadata.findOne({ type: 'activities' });
    const stale = force || isCacheStale(meta?.lastRefreshed);

    if (!stale) {
      const cached = await Activity.find({}).lean();
      const mapped = cached.map(({ stravaId, raw }) => ({ ...raw, id: stravaId }));
      return NextResponse.json(mapped);
    }

    const activities = await stravaFetch('/athlete/activities?page=1&per_page=100');

    const ops = (activities as Record<string, unknown>[]).map((a) => {
      const stravaId = a.id as number;
      return {
        updateOne: {
          filter: { stravaId },
          update: {
            $set: {
              stravaId,
              name: a.name as string,
              type: a.type as string,
              distance: (a.distance as number) ?? 0,
              moving_time: (a.moving_time as number) ?? 0,
              elapsed_time: (a.elapsed_time as number) ?? 0,
              elevation_gain: (a.total_elevation_gain as number) ?? (a.elevation_gain as number) ?? 0,
              start_date: a.start_date as string,
              average_speed: (a.average_speed as number) ?? 0,
              max_speed: (a.max_speed as number) ?? 0,
              average_heartrate: a.average_heartrate as number | undefined,
              max_heartrate: a.max_heartrate as number | undefined,
              polyline: (a.map as Record<string, unknown> | undefined)?.summary_polyline as string | undefined,
              raw: a,
            },
          },
          upsert: true,
        },
      };
    });

    await Activity.bulkWrite(ops);

    await CacheMetadata.updateOne(
      { type: 'activities' },
      { $set: { lastRefreshed: new Date() } },
      { upsert: true }
    );

    return NextResponse.json(activities);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
