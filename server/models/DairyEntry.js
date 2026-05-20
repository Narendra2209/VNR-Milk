const mongoose = require('mongoose');

const DairyEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true, index: true },
  session: { type: String, enum: ['Morning', 'Evening'], required: true },
  dairy: { type: String, required: true, trim: true, index: true },
  quantity: { type: Number, required: true, min: 0 },
  fat: { type: Number, required: true, min: 0 },
  pricePerFat: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('DairyEntry', DairyEntrySchema);
