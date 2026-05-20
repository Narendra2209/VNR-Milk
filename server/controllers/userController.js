const User = require('../models/User');
const Dairy = require('../models/Dairy');
const asyncHandler = require('../utils/asyncHandler');

async function resolveActiveDairies(raw) {
  if (!Array.isArray(raw)) return { ok: false, message: 'dairies must be an array' };
  const names = Array.from(new Set(raw.map((n) => String(n || '').trim()).filter(Boolean)));
  if (names.length === 0) return { ok: false, message: 'Assign at least one dairy to the owner' };
  const found = await Dairy.find({ name: { $in: names }, active: true }).select('name');
  const foundNames = new Set(found.map((d) => d.name));
  const missing = names.filter((n) => !foundNames.has(n));
  if (missing.length) return { ok: false, message: `Unknown or inactive dairy: ${missing.join(', ')}` };
  return { ok: true, names };
}

exports.listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users.map((u) => u.toSafeJSON()));
});

exports.createUser = asyncHandler(async (req, res) => {
  const { username, password, role, dairies } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'username, password and role are required' });
  }
  if (!['admin', 'owner'].includes(role)) {
    return res.status(400).json({ message: 'role must be admin or owner' });
  }
  let ownerDairies = [];
  if (role === 'owner') {
    const check = await resolveActiveDairies(dairies);
    if (!check.ok) return res.status(400).json({ message: check.message });
    ownerDairies = check.names;
  }

  const exists = await User.findOne({ username: String(username).toLowerCase().trim() });
  if (exists) return res.status(409).json({ message: 'Username already taken' });

  const user = new User({
    username: String(username).toLowerCase().trim(),
    role,
    dairies: ownerDairies,
    active: true
  });
  await user.setPassword(password);
  await user.save();
  res.status(201).json(user.toSafeJSON());
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password, dairies, active } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (typeof active === 'boolean') user.active = active;
  if (user.role === 'owner' && dairies !== undefined) {
    const check = await resolveActiveDairies(dairies);
    if (!check.ok) return res.status(400).json({ message: check.message });
    user.dairies = check.names;
  }
  if (password) await user.setPassword(password);

  await user.save();
  res.json(user.toSafeJSON());
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (String(req.user._id) === String(id)) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }
  const user = await User.findByIdAndDelete(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'Deleted' });
});
