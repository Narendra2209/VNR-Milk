const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  serialNumber: { type: String, required: true, unique: true, index: true, trim: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  milkType: { type: String, enum: ['Buffalo'], default: 'Buffalo' },
  pricePerFat: { type: Number, default: 10, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
