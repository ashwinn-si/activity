import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAthleteProfile {
  id: number;
  firstname: string;
  lastname: string;
  city?: string;
  state?: string;
  country?: string;
  profile?: string;        // full-size avatar URL
  profile_medium?: string; // 62x62 avatar URL
  created_at?: string;     // ISO string — used on Profile page for "Member since"
  sex?: string;
  weight?: number;
  [key: string]: unknown;  // allow any other Strava fields
}

export interface IAthleteCache extends Document {
  singleton: string;
  athlete: IAthleteProfile;
  stats: Record<string, unknown>;
  cachedAt: Date;
}

const AthleteCacheSchema = new Schema<IAthleteCache>({
  singleton: { type: String, default: 'athlete', unique: true },
  athlete:   { type: Schema.Types.Mixed, required: true },
  stats:     { type: Schema.Types.Mixed, required: true },
  cachedAt:  { type: Date, default: Date.now },
});

export const AthleteCache: Model<IAthleteCache> =
  mongoose.models.AthleteCache ||
  mongoose.model<IAthleteCache>('AthleteCache', AthleteCacheSchema);
