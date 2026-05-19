import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IForthcomingTitle extends Document {
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ForthcomingTitleSchema: Schema<IForthcomingTitle> = new Schema(
  {
    title: { type: String, required: true, trim: true, default: 'Forthcoming Books' },
    description: { type: String, trim: true, default: 'Be the first to explore our soon-to-be-released titles' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

let ForthcomingTitleModel: Model<IForthcomingTitle>;
if (mongoose.models.ForthcomingTitle) {
  ForthcomingTitleModel = mongoose.models.ForthcomingTitle as Model<IForthcomingTitle>;
} else {
  ForthcomingTitleModel = mongoose.model<IForthcomingTitle>('ForthcomingTitle', ForthcomingTitleSchema);
}

export default ForthcomingTitleModel;
