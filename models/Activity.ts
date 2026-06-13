import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivity extends Document {
  stravaId: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
  start_date: string;
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
    distance:          { type: Number, default: 0 },
    moving_time:       { type: Number, default: 0 },
    elapsed_time:      { type: Number, default: 0 },
    elevation_gain:    { type: Number, default: 0 },
    start_date:        { type: String, required: true },
    average_speed:     { type: Number, default: 0 },
    max_speed:         { type: Number, default: 0 },
    average_heartrate: { type: Number },
    max_heartrate:     { type: Number },
    polyline:          { type: String },
    raw:               { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>('Activity', ActivitySchema);
