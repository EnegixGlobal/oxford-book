import mongoose, { Document, Schema } from 'mongoose';

export interface IRateLimit extends Document {
  identifier: string; // IP address or userId
  count: number;
  windowStart: Date;
  lastRequest: Date;
  expiresAt: Date;
  createdAt: Date;
}

const RateLimitSchema: Schema<IRateLimit> = new Schema({
  identifier: {
    type: String,
    required: true,
    index: true,
  },
  count: {
    type: Number,
    required: true,
    default: 1,
    min: 0,
  },
  windowStart: {
    type: Date,
    required: true,
    index: true,
  },
  lastRequest: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // Auto-delete expired records
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
RateLimitSchema.index({ identifier: 1, windowStart: 1 });

export default mongoose.models.RateLimit || mongoose.model<IRateLimit>('RateLimit', RateLimitSchema);

