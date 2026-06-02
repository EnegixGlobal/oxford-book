import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function cleanBookIndexes(mongooseInstance: any) {
  try {
    const db = mongooseInstance.connection.db;
    if (db) {
      const collections = await db.listCollections({ name: 'books' }).toArray();
      if (collections.length > 0) {
        const indexes = await db.collection('books').listIndexes().toArray();
        let dropped = false;
        for (const idx of indexes) {
          const isTextIndex = Object.values(idx.key).some((val) => val === 'text');
          if (isTextIndex && idx.language_override !== 'textLanguage') {
            await db.collection('books').dropIndex(idx.name);
            console.log(`✅ Successfully dropped old text index: ${idx.name}`);
            dropped = true;
          }
        }
        if (dropped && mongooseInstance.models.Book) {
          await mongooseInstance.models.Book.createIndexes();
          console.log('✅ Successfully rebuilt Book indexes');
        }
      }
    }
  } catch (err) {
    console.error('⚠️ Failed to clean up old text index:', err);
  }
}

async function connectDB() {
  if (cached.conn) {
    if (!cached.indexCleaned) {
      await cleanBookIndexes(cached.conn);
      cached.indexCleaned = true;
    }
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongooseInstance) => {
      console.log('✅ Connected to MongoDB');
      await cleanBookIndexes(mongooseInstance);
      cached.indexCleaned = true;
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
