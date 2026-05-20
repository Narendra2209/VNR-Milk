const Dairy = require('../models/Dairy');

async function seedDairies() {
  const defaults = ['RR Dairy', 'Nature Dairy'];
  for (const name of defaults) {
    const existing = await Dairy.findOne({ name });
    if (!existing) {
      await Dairy.create({ name, active: true });
      console.log(`[seedDairies] Created default dairy "${name}".`);
    }
  }
}

module.exports = seedDairies;
