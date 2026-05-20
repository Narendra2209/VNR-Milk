const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../middleware/auth');

exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'username and password are required' });
  }
  const user = await User.findOne({ username: String(username).toLowerCase().trim() });
  if (!user || !user.active) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const ok = await user.verifyPassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken(user);
  res.json({ token, user: user.toSafeJSON() });
});

exports.me = asyncHandler(async (req, res) => {
  res.json(req.user.toSafeJSON());
});
