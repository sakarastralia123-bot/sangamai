// Bootstrap script — the ONLY way to create an admin.
// There is deliberately no API/UI path to self-promote.
// Usage: node scripts/make-admin.js user@example.com
//        npm run make-admin -- user@example.com
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  const email = String(process.argv[2] || '').toLowerCase().trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    console.error('Usage: node scripts/make-admin.js user@example.com');
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set (.env missing?)');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const User = require('../src/models/User');

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No user found with email ${email} — register first, then promote.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.role = 'admin';
  await user.save({ validateBeforeSave: false });
  console.log(`OK: ${email} is now an admin.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
