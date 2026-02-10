import mongoose, { Document, Schema } from 'mongoose';

export interface IPasswordResetToken extends Document {
  token: string; // Unique reset token
  userId: mongoose.Types.ObjectId;
  email: string; // Store email for quick lookup
  expiresAt: Date;
  used: boolean; // Track if token has been used
  createdAt: Date;
}

const PasswordResetTokenSchema: Schema<IPasswordResetToken> = new Schema({
  token: {
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
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // Auto-delete expired tokens
  },
  used: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
PasswordResetTokenSchema.index({ userId: 1, expiresAt: 1 });
PasswordResetTokenSchema.index({ token: 1, expiresAt: 1, used: 1 });
PasswordResetTokenSchema.index({ email: 1, expiresAt: 1, used: 1 });

export default mongoose.models.PasswordResetToken || mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);

