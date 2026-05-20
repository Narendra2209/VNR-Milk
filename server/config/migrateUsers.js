const mongoose = require('mongoose');

async function migrateUserDairies() {
  const Users = mongoose.connection.collection('users');
  const stragglers = await Users.find({ dairy: { $exists: true, $ne: null } }).toArray();
  if (stragglers.length === 0) return;

  for (const u of stragglers) {
    const existing = Array.isArray(u.dairies) ? u.dairies : [];
    const merged = Array.from(new Set([...existing, u.dairy].filter(Boolean)));
    await Users.updateOne(
      { _id: u._id },
      { $set: { dairies: merged }, $unset: { dairy: '' } }
    );
  }
  console.log(`[migrateUserDairies] Converted dairy → dairies for ${stragglers.length} user(s).`);
}

module.exports = migrateUserDairies;
