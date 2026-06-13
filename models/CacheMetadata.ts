import mongoose, { Schema, Document, Model } from 'mongoose';

export type CacheType = 'activities' | 'athlete' | 'activity_detail';

export interface ICacheMetadata extends Document {
  type: CacheType;
  stravaId?: number;
  lastRefreshed: Date;
}

const CacheMetadataSchema = new Schema<ICacheMetadata>({
  type: { type: String, required: true },
  stravaId: { type: Number },
  lastRefreshed: { type: Date, required: true },
});

CacheMetadataSchema.index({ type: 1, stravaId: 1 }, { unique: true, sparse: true });

export const CacheMetadata: Model<ICacheMetadata> =
  mongoose.models.CacheMetadata ||
  mongoose.model<ICacheMetadata>('CacheMetadata', CacheMetadataSchema);
