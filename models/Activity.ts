import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivity extends Document {
  stravaId: number;
  name: string;
  type: string;
  sport_type: string;       // Strava v3 granular type (TrailRun, VirtualRide, GravelRide, etc.)
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
  start_date: string;       // UTC ISO string from Strava
  start_date_local: string; // Local-timezone ISO string — use this for calendar/heatmap grouping
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  polyline?: string;
  raw: Record<string, unknown>;
}

const ActivitySchema = new Schema<IActivity>(
  {
    stravaId:          { type: Number, required: true, unique: true, index: true },
    name:              { type: String, required: true },
    type:              { type: String, required: true },
    sport_type:        { type: String, required: true },
    distance:          { type: Number, default: 0 },
    moving_time:       { type: Number, default: 0 },
    elapsed_time:      { type: Number, default: 0 },
    elevation_gain:    { type: Number, default: 0 },
    start_date:        { type: String, required: true },
    start_date_local:  { type: String, required: true },
    average_speed:     { type: Number, default: 0 },
    max_speed:         { type: Number, default: 0 },
    average_heartrate: { type: Number },
    max_heartrate:     { type: Number },
    polyline:          { type: String },
    raw:               { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Compound index for date-range queries (heatmap, dashboard filtering)
ActivitySchema.index({ start_date_local: 1 });
ActivitySchema.index({ type: 1, start_date_local: 1 });

export const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>('Activity', ActivitySchema);
