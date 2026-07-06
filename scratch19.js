
const mongoose = require('mongoose');
async function run() {
  await mongoose.connect('mongodb://localhost:27017/stoxify_db');
  const db = mongoose.connection.db;
  const docs = await db.collection('notifications').find({ user_id: 'ANALYST_V1ZwRLD5jZ' }).toArray();
  console.log('stoxify_db DOCS LENGTH:', docs.length);
  
  await mongoose.disconnect();
  await mongoose.connect('mongodb://localhost:27017/stoxify');
  const db2 = mongoose.connection.db;
  const docs2 = await db2.collection('notifications').find({ user_id: 'ANALYST_V1ZwRLD5jZ' }).toArray();
  console.log('stoxify DOCS LENGTH:', docs2.length);
  
  process.exit(0);
}
run();

