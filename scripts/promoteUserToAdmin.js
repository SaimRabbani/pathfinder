require('dotenv').config();

const connectDB = require('../server/config/db');
const User = require('../server/models/User');

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error('Usage: node scripts/promoteUserToAdmin.js <email>');
  }

  await connectDB();

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error(`No user found for email: ${email}`);
  }

  user.role = 'admin';
  await user.save();

  console.log(`User ${email} has been promoted to admin.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
