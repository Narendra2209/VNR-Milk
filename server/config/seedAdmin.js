const User = require('../models/User');

async function seedAdmin() {
  const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await User.findOne({ username });
  if (existing) {
    if (existing.role !== 'admin') {
      console.warn(`[seedAdmin] User "${username}" exists but role is "${existing.role}". Not modifying.`);
    }
    return;
  }

  const user = new User({ username, role: 'admin', active: true, dairy: null });
  await user.setPassword(password);
  await user.save();
  console.log(`[seedAdmin] Bootstrap admin "${username}" created. Change the password after first login.`);
}

module.exports = seedAdmin;
