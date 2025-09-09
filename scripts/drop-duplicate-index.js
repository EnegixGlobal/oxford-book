import mongoose from 'mongoose';

async function dropDuplicateIndex() {
  try {
    // Connect to MongoDB (hardcoded for migration)
    const mongoUri = 'mongodb+srv://enegixwebsolution_db_user:CLOWQlbOfcwY22ww@oxford-book.uczgmsq.mongodb.net/oxford-book';

    await mongoose.connect(mongoUri);

    console.log('Connected to MongoDB');

    // Get the collection
    const collection = mongoose.connection.db.collection('categories');

    // Check existing indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Drop the problematic index if it exists
    try {
      await collection.dropIndex('subcategories.slug_1');
      console.log('Dropped index: subcategories.slug_1');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index subcategories.slug_1 does not exist');
      } else {
        console.log('Error dropping index:', error.message);
      }
    }

    // Also try dropping any other potential problematic indexes
    const indexNames = [
      'subcategories.slug_1',
      'subcategories.slug',
      'subcategories.name_1',
      'subcategories.name'
    ];

    for (const indexName of indexNames) {
      try {
        await collection.dropIndex(indexName);
        console.log(`Dropped index: ${indexName}`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`Index ${indexName} does not exist`);
        } else {
          console.log(`Error dropping index ${indexName}:`, error.message);
        }
      }
    }

    // Recreate necessary indexes without unique constraints
    await collection.createIndex({ slug: 1 });
    await collection.createIndex({ featured: 1 });
    await collection.createIndex({ name: 1 });

    console.log('Migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
dropDuplicateIndex();

    console.log('Connected to MongoDB');

    // Get the collection
    const collection = mongoose.connection.db.collection('categories');

    // Check existing indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Drop the problematic index if it exists
    try {
      await collection.dropIndex('subcategories.slug_1');
      console.log('Dropped index: subcategories.slug_1');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index subcategories.slug_1 does not exist');
      } else {
        console.log('Error dropping index:', error.message);
      }
    }

    // Also try dropping any other potential problematic indexes
    const indexNames = [
      'subcategories.slug_1',
      'subcategories.slug',
      'subcategories.name_1',
      'subcategories.name'
    ];

    for (const indexName of indexNames) {
      try {
        await collection.dropIndex(indexName);
        console.log(`Dropped index: ${indexName}`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`Index ${indexName} does not exist`);
        } else {
          console.log(`Error dropping index ${indexName}:`, error.message);
        }
      }
    }

    // Recreate necessary indexes without unique constraints
    await collection.createIndex({ slug: 1 });
    await collection.createIndex({ featured: 1 });
    await collection.createIndex({ name: 1 });

    console.log('Migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
dropDuplicateIndex();
