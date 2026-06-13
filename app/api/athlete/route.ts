import { stravaFetch } from '@/lib/strava';
import { connectDB, isCacheStale } from '@/lib/mongodb';
import { AthleteCache } from '@/models/AthleteCache';
import { CacheMetadata } from '@/models/CacheMetadata';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const meta = await CacheMetadata.findOne({ type: 'athlete' });
    const stale = force || isCacheStale(meta?.lastRefreshed);

    if (!stale) {
      const cached = await AthleteCache.findOne({ singleton: 'athlete' }).lean();
      if (cached) {
        return NextResponse.json({ athlete: cached.athlete, stats: cached.stats });
      }
    }

    const athlete = await stravaFetch('/athlete');
    const stats = await stravaFetch(`/athletes/${athlete.id}/stats`);

    await AthleteCache.updateOne(
      { singleton: 'athlete' },
      { $set: { athlete, stats } },
      { upsert: true }
    );

    await CacheMetadata.updateOne(
      { type: 'athlete' },
      { $set: { lastRefreshed: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ athlete, stats });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
