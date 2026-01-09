import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  bookId: mongoose.Types.ObjectId | null; // may be null if coming from sample/static
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
  coverImage?: string;
}

export interface ITrackingCheckpoint {
  status: string;
  timestamp: Date;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderId: string; // merchant facing order id (used for payment)
  paymentOrderId?: string; // gateway order id / reference
  merchantTransactionId?: string; // legacy / gateway reference to avoid null unique index collisions
  paymentGatewayTxnId?: string; // captured gateway transaction/reference id once available
  items: IOrderItem[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod?: 'online' | 'cod';
  status: 'created' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentCompletedAt?: Date;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  trackingInfo: {
    orderPlaced?: ITrackingCheckpoint;
    confirmed?: ITrackingCheckpoint;
    shipped?: ITrackingCheckpoint;
    delivered?: ITrackingCheckpoint;
    cancelled?: ITrackingCheckpoint;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: false },
  title: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
  coverImage: { type: String, trim: true }
});

const OrderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderId: { type: String, required: true, unique: true, index: true },
  paymentOrderId: { type: String },
  merchantTransactionId: { type: String, index: true },
  paymentGatewayTxnId: { type: String },
  items: { type: [OrderItemSchema], required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending', index: true },
  paymentMethod: { type: String, enum: ['online', 'cod'], default: 'online' },
  status: { type: String, enum: ['created', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'created', index: true },
  paymentCompletedAt: { type: Date },
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true }
  },
  trackingInfo: {
    orderPlaced: { type: Schema.Types.Mixed, default: undefined },
    confirmed: { type: Schema.Types.Mixed, default: undefined },
    shipped: { type: Schema.Types.Mixed, default: undefined },
    delivered: { type: Schema.Types.Mixed, default: undefined },
    cancelled: { type: Schema.Types.Mixed, default: undefined },
  }
}, { timestamps: true });

// Simple orderId generator if not provided
OrderSchema.pre('validate', function(next) {
  if (!this.orderId) {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    this.orderId = `ORD-${Date.now()}-${rand}`;
  }
  next();
});

// Ensure merchantTransactionId always set (legacy unique index safety)
OrderSchema.pre('save', function(next) {
  if (!this.merchantTransactionId) {
    this.merchantTransactionId = this.orderId;
  }
  next();
});

let OrderModel: Model<IOrder>;
if (mongoose.models.Order) {
  OrderModel = mongoose.models.Order as Model<IOrder>;
} else {
  OrderModel = mongoose.model<IOrder>('Order', OrderSchema);
}

export default OrderModel;