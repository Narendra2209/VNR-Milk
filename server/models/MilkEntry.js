const mongoose = require('mongoose');

const MilkEntrySchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  serialNumber: { type: String, required: true, index: true },
  customerName: String,
  date: { type: Date, required: true, index: true },
  session: { type: String, enum: ['Morning', 'Evening'], required: true },
  quantity: { type: Number, required: true, min: 0 },
  fat: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  editedBy: { type: String }
}, { timestamps: true });

MilkEntrySchema.index({ date: 1, session: 1, customerId: 1 }, { unique: true });

module.exports = mongoose.model('MilkEntry', MilkEntrySchema);
