const MilkEntry = require('../models/MilkEntry');
const Customer = require('../models/Customer');
const asyncHandler = require('../utils/asyncHandler');
const { calculateAmount } = require('../services/rateService');

exports.createMilkEntry = asyncHandler(async (req, res) => {
  const { serialNumber, date, session, quantity, fat } = req.body;

  const customer = await Customer.findOne({ serialNumber });
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found for the given serial number' });
  }

  const { rate, totalAmount } = calculateAmount(Number(quantity), Number(fat), customer.pricePerFat);
  const entryDate = date ? new Date(date) : new Date();
  entryDate.setHours(0, 0, 0, 0);

  const query = { customerId: customer._id, date: entryDate, session };
  const existingEntry = await MilkEntry.exists(query);
  const updateData = {
    customerId: customer._id,
    serialNumber: customer.serialNumber,
    customerName: customer.name,
    date: entryDate,
    session,
    quantity: Number(quantity),
    fat: Number(fat),
    rate,
    totalAmount
  };

  if (existingEntry) {
    updateData.editedBy = req.user.username;
  }

  const entry = await MilkEntry.findOneAndUpdate(query, updateData, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  });

  res.status(201).json(entry);
});

exports.getMilkEntries = asyncHandler(async (req, res) => {
  const { date, session, serialNumber, from, to } = req.query;
  const query = {};

  if (session) query.session = session;
  if (serialNumber) query.serialNumber = serialNumber;

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

  const entries = await MilkEntry.find(query).sort({ date: -1, serialNumber: 1 });
  res.json(entries);
});
