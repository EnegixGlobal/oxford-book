const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read and parse .env manually to see exactly what is configured
const envPath = path.join(__dirname, '..', '.env');
let envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      envConfig[key] = value.trim();
    }
  });
}

console.log('--- Configured Environment Variables ---');
console.log('PORT:', envConfig.PORT || process.env.PORT);
console.log('MONGO_URI exists:', !!(envConfig.MONGO_URI || process.env.MONGO_URI));
console.log('SHIPROCKET_EMAIL:', envConfig.SHIPROCKET_EMAIL || process.env.SHIPROCKET_EMAIL || 'NOT SET');
console.log('SHIPROCKET_PASSWORD:', envConfig.SHIPROCKET_PASSWORD || process.env.SHIPROCKET_PASSWORD || 'NOT SET');
console.log('SHIPROCKET_AUTO_CREATE:', envConfig.SHIPROCKET_AUTO_CREATE || process.env.SHIPROCKET_AUTO_CREATE || 'NOT SET');
console.log('SHIPROCKET_PICKUP_LOCATION:', envConfig.SHIPROCKET_PICKUP_LOCATION || process.env.SHIPROCKET_PICKUP_LOCATION || 'NOT SET');
console.log('----------------------------------------');

const mongoUri = envConfig.MONGO_URI || process.env.MONGO_URI;

if (!mongoUri) {
  console.error('MONGO_URI is not set in .env');
  process.exit(1);
}

const OrderSchema = new mongoose.Schema({
  orderId: String,
  items: Array,
  totalAmount: Number,
  paymentStatus: String,
  paymentMethod: String,
  status: String,
  shippingAddress: Object,
  shiprocketShipmentId: Number,
  shiprocketAWB: String,
  createdAt: Date
}, { strict: false });

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri.trim());
    console.log('Connected!');

    const count = await Order.countDocuments();
    console.log(`Total orders in DB: ${count}`);

    const latestOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    console.log('\n--- LATEST 5 ORDERS ---');
    latestOrders.forEach((order, index) => {
      console.log(`\nOrder #${index + 1}:`);
      console.log('  ID:', order._id);
      console.log('  orderId:', order.orderId);
      console.log('  createdAt:', order.createdAt);
      console.log('  paymentMethod:', order.paymentMethod);
      console.log('  paymentStatus:', order.paymentStatus);
      console.log('  status:', order.status);
      console.log('  shiprocketShipmentId:', order.shiprocketShipmentId);
      console.log('  shiprocketAWB:', order.shiprocketAWB);
      console.log('  shippingAddress.fullName:', order.shippingAddress?.fullName);
      console.log('  items count:', order.items?.length);
      if (order.items && order.items.length > 0) {
        console.log('  items:', order.items.map(it => ({
          bookId: it.bookId,
          title: it.title,
          price: it.price,
          quantity: it.quantity
        })));
      }
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (err) {
    console.error('Error running diagnostics:', err);
  }
}

run();
