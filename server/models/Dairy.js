const mongoose = require('mongoose');

const DairySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Dairy', DairySchema);
