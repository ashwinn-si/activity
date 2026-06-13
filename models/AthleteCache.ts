import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAthleteCache extends Document {
  singleton: string;
  athlete: Record<string, unknown>;
  stats: Record<string, unknown>;
}

const AthleteCacheSchema = new Schema<IAthleteCache>({
  singleton: { type: String, default: 'athlete', unique: true },
  athlete:   { type: Schema.Types.Mixed, required: true },
  stats:     { type: Schema.Types.Mixed, required: true },
});

export const AthleteCache: Model<IAthleteCache> =
  mongoose.models.AthleteCache ||
  mongoose.model<IAthleteCache>('AthleteCache', AthleteCacheSchema);
