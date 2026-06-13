import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityDetailCache extends Document {
  stravaId: number;
  activity: Record<string, unknown>;
  streams: Record<string, unknown>;
}

const ActivityDetailCacheSchema = new Schema<IActivityDetailCache>(
  {
    stravaId: { type: Number, required: true, unique: true, index: true },
    activity: { type: Schema.Types.Mixed, required: true },
    streams:  { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const ActivityDetailCache: Model<IActivityDetailCache> =
  mongoose.models.ActivityDetailCache ||
  mongoose.model<IActivityDetailCache>('ActivityDetailCache', ActivityDetailCacheSchema);
