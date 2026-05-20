const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'owner'], required: true },
  dairies: { type: [String], default: [] },
  active: { type: Boolean, default: true }
}, { timestamps: true });

UserSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

UserSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.methods.toSafeJSON = function () {
  return {
    _id: this._id,
    username: this.username,
    role: this.role,
    dairies: this.dairies || [],
    active: this.active,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', UserSchema);
