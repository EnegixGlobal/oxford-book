import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  sessionId: string; // Unique session identifier
  userId: mongoose.Types.ObjectId;
  role: 'customer' | 'admin';
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  lastActivity: Date;
  createdAt: Date;
}

const SessionSchema: Schema<ISession> = new Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    required: true,
    index: true,
  },
  userAgent: {
    type: String,
    trim: true,
  },
  ipAddress: {
    type: String,
    trim: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // Auto-delete expired sessions
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
SessionSchema.index({ userId: 1, expiresAt: 1 });
SessionSchema.index({ sessionId: 1, expiresAt: 1 });

export default mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

