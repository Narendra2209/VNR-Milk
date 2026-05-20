const DairyEntry = require('../models/DairyEntry');
const Dairy = require('../models/Dairy');
const asyncHandler = require('../utils/asyncHandler');

exports.createDairyEntry = asyncHandler(async (req, res) => {
  const { date, session, dairy, quantity, fat, pricePerFat } = req.body;

  const q = Number(quantity);
  const f = Number(fat);
  const p = Number(pricePerFat);

  if (!q || !f || !p) {
    return res.status(400).json({ message: 'quantity, fat and pricePerFat are required and must be > 0' });
  }
  if (!['Morning', 'Evening'].includes(session)) {
    return res.status(400).json({ message: 'session must be Morning or Evening' });
  }

  const dairyName = String(dairy || '').trim();
  if (!dairyName) return res.status(400).json({ message: 'dairy is required' });

  if (req.user.role === 'owner') {
    const owned = Array.isArray(req.user.dairies) ? req.user.dairies : [];
    if (!owned.includes(dairyName)) {
      return res.status(403).json({ message: `You are not assigned to "${dairyName}"` });
    }
  } else {
    const exists = await Dairy.findOne({ name: dairyName, active: true });
    if (!exists) return res.status(400).json({ message: `Unknown or inactive dairy: ${dairyName}` });
  }

  const entryDate = date ? new Date(date) : new Date();
  entryDate.setHours(0, 0, 0, 0);

  const rate = Number(((f * p) / 10).toFixed(2));
  const totalAmount = Number((q * rate).toFixed(2));

  const entry = await DairyEntry.create({
    date: entryDate,
    session,
    dairy: dairyName,
    quantity: q,
    fat: f,
    pricePerFat: Number(p.toFixed(2)),
    rate,
    totalAmount
  });

  res.status(201).json(entry);
});

exports.getDairyEntries = asyncHandler(async (req, res) => {
  const { date, session, dairy, from, to } = req.query;
  const query = {};

  if (session) query.session = session;
  if (req.user && req.user.role === 'owner') {
    const owned = Array.isArray(req.user.dairies) ? req.user.dairies : [];
    if (dairy) {
      if (!owned.includes(dairy)) return res.json([]);
      query.dairy = dairy;
    } else {
      query.dairy = { $in: owned };
    }
  } else if (dairy) {
    query.dairy = dairy;
  }

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query.date = { $gte: start, $lt: end };
  } else if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) {
      const t = new Date(to);
      t.setHours(23, 59, 59, 999);
      query.date.$lte = t;
    }
  }

  const entries = await DairyEntry.find(query).sort({ date: -1, session: 1, createdAt: -1 });
  res.json(entries);
});

exports.updateDairyEntry = asyncHandler(async (req, res) => {
  const { date, session, dairy, quantity, fat, pricePerFat } = req.body;

  const q = Number(quantity);
  const f = Number(fat);
  const p = Number(pricePerFat);

  if (!q || !f || !p) {
    return res.status(400).json({ message: 'quantity, fat and pricePerFat are required and must be > 0' });
  }
  if (!['Morning', 'Evening'].includes(session)) {
    return res.status(400).json({ message: 'session must be Morning or Evening' });
  }

  const dairyName = String(dairy || '').trim();
  if (!dairyName) return res.status(400).json({ message: 'dairy is required' });

  const entry = await DairyEntry.findById(req.params.id);
  if (!entry) return res.status(404).json({ message: 'Entry not found' });

  if (req.user.role === 'owner') {
    const owned = Array.isArray(req.user.dairies) ? req.user.dairies : [];
    if (!owned.includes(entry.dairy) || !owned.includes(dairyName)) {
      return res.status(403).json({ message: `You are not allowed to update this dairy entry` });
    }
  } else {
    const exists = await Dairy.findOne({ name: dairyName, active: true });
    if (!exists) return res.status(400).json({ message: `Unknown or inactive dairy: ${dairyName}` });
  }

  const entryDate = date ? new Date(date) : new Date();
  entryDate.setHours(0, 0, 0, 0);

  entry.date = entryDate;
  entry.session = session;
  entry.dairy = dairyName;
  entry.quantity = q;
  entry.fat = f;
  entry.pricePerFat = Number(p.toFixed(2));
  entry.rate = Number(((f * p) / 10).toFixed(2));
  entry.totalAmount = Number((q * entry.rate).toFixed(2));

  await entry.save();
  res.json(entry);
});

exports.deleteDairyEntry = asyncHandler(async (req, res) => {
  const entry = await DairyEntry.findByIdAndDelete(req.params.id);
  if (!entry) return res.status(404).json({ message: 'Entry not found' });
  res.json({ message: 'Deleted' });
});
