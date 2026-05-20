const MilkEntry = require('../models/MilkEntry');
const Customer = require('../models/Customer');
const asyncHandler = require('../utils/asyncHandler');

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const round = (n) => Number(Number(n || 0).toFixed(2));

exports.dailyReport = asyncHandler(async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const { serialNumber } = req.query;
  const query = { date: { $gte: startOfDay(date), $lte: endOfDay(date) } };
  if (serialNumber) query.serialNumber = serialNumber;
  const entries = await MilkEntry.find(query).sort({ serialNumber: 1, session: 1 });

  const totals = entries.reduce(
    (acc, e) => {
      acc.quantity += e.quantity;
      acc.amount += e.totalAmount;
      acc.fatSum += e.fat;
      return acc;
    },
    { quantity: 0, amount: 0, fatSum: 0 }
  );

  res.json({
    date: startOfDay(date),
    count: entries.length,
    totalQuantity: round(totals.quantity),
    totalAmount: round(totals.amount),
    averageFat: entries.length ? round(totals.fatSum / entries.length) : 0,
    entries
  });
});

exports.tenDayReport = asyncHandler(async (req, res) => {
  const end = req.query.end ? new Date(req.query.end) : new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 9);
  const { serialNumber } = req.query;

  const match = { date: { $gte: startOfDay(start), $lte: endOfDay(end) } };
  if (serialNumber) match.serialNumber = serialNumber;

  const data = await MilkEntry.aggregate([
    { $match: match },
    {
      $group: {
        _id: { customerId: '$customerId', serialNumber: '$serialNumber', customerName: '$customerName' },
        totalQuantity: { $sum: '$quantity' },
        totalAmount: { $sum: '$totalAmount' },
        avgFat: { $avg: '$fat' },
        entries: { $sum: 1 }
      }
    },
    { $sort: { '_id.serialNumber': 1 } }
  ]);

  const grand = data.reduce(
    (a, r) => {
      a.quantity += r.totalQuantity;
      a.amount += r.totalAmount;
      return a;
    },
    { quantity: 0, amount: 0 }
  );

  res.json({
    from: startOfDay(start),
    to: endOfDay(end),
    rows: data.map((d) => ({
      serialNumber: d._id.serialNumber,
      customerName: d._id.customerName,
      totalQuantity: round(d.totalQuantity),
      totalAmount: round(d.totalAmount),
      averageFat: round(d.avgFat),
      entries: d.entries
    })),
    grandTotal: { quantity: round(grand.quantity), amount: round(grand.amount) }
  });
});

exports.monthlyReport = asyncHandler(async (req, res) => {
  const now = req.query.month ? new Date(req.query.month) : new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const { serialNumber } = req.query;

  const match = { date: { $gte: start, $lte: end } };
  if (serialNumber) match.serialNumber = serialNumber;

  const data = await MilkEntry.aggregate([
    { $match: match },
    {
      $group: {
        _id: { customerId: '$customerId', serialNumber: '$serialNumber', customerName: '$customerName' },
        morningQty: { $sum: { $cond: [{ $eq: ['$session', 'Morning'] }, '$quantity', 0] } },
        eveningQty: { $sum: { $cond: [{ $eq: ['$session', 'Evening'] }, '$quantity', 0] } },
        totalQuantity: { $sum: '$quantity' },
        totalAmount: { $sum: '$totalAmount' },
        avgFat: { $avg: '$fat' }
      }
    },
    { $sort: { '_id.serialNumber': 1 } }
  ]);

  const grand = data.reduce(
    (a, r) => {
      a.morning += r.morningQty;
      a.evening += r.eveningQty;
      a.qty += r.totalQuantity;
      a.amount += r.totalAmount;
      return a;
    },
    { morning: 0, evening: 0, qty: 0, amount: 0 }
  );

  res.json({
    from: start,
    to: end,
    rows: data.map((d) => ({
      serialNumber: d._id.serialNumber,
      customerName: d._id.customerName,
      morningQuantity: round(d.morningQty),
      eveningQuantity: round(d.eveningQty),
      totalQuantity: round(d.totalQuantity),
      totalAmount: round(d.totalAmount),
      averageFat: round(d.avgFat)
    })),
    grandTotal: {
      morningQuantity: round(grand.morning),
      eveningQuantity: round(grand.evening),
      totalQuantity: round(grand.qty),
      totalAmount: round(grand.amount)
    }
  });
});

exports.customerDiary = asyncHandler(async (req, res) => {
  const { serialNumber, from, to } = req.query;
  if (!serialNumber) {
    return res.status(400).json({ message: 'serialNumber is required' });
  }

  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(defaultStart.getDate() - 30);

  const start = startOfDay(from ? new Date(from) : defaultStart);
  const end = endOfDay(to ? new Date(to) : today);

  const customer = await Customer.findOne({ serialNumber });
  const entries = await MilkEntry.find({
    serialNumber,
    date: { $gte: start, $lte: end }
  }).sort({ date: 1, session: 1 });

  const totals = entries.reduce(
    (a, e) => {
      a.quantity += e.quantity;
      a.amount += e.totalAmount;
      a.fatSum += e.fat;
      if (e.session === 'Morning') {
        a.morningQty += e.quantity;
        a.morningAmt += e.totalAmount;
      } else {
        a.eveningQty += e.quantity;
        a.eveningAmt += e.totalAmount;
      }
      return a;
    },
    { quantity: 0, amount: 0, fatSum: 0, morningQty: 0, eveningQty: 0, morningAmt: 0, eveningAmt: 0 }
  );

  res.json({
    customer,
    from: start,
    to: end,
    count: entries.length,
    totalQuantity: round(totals.quantity),
    totalAmount: round(totals.amount),
    averageFat: entries.length ? round(totals.fatSum / entries.length) : 0,
    morningQuantity: round(totals.morningQty),
    eveningQuantity: round(totals.eveningQty),
    morningAmount: round(totals.morningAmt),
    eveningAmount: round(totals.eveningAmt),
    entries
  });
});

exports.dashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const sDay = startOfDay(today);
  const eDay = endOfDay(today);
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [totalCustomers, todayAgg, allTimeAgg, monthlyTrend, fatTrend] = await Promise.all([
    Customer.countDocuments(),
    MilkEntry.aggregate([
      { $match: { date: { $gte: sDay, $lte: eDay } } },
      { $group: { _id: '$session', quantity: { $sum: '$quantity' }, amount: { $sum: '$totalAmount' } } }
    ]),
    MilkEntry.aggregate([
      { $group: { _id: null, quantity: { $sum: '$quantity' }, amount: { $sum: '$totalAmount' } } }
    ]),
    MilkEntry.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' } },
          quantity: { $sum: '$quantity' },
          amount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]),
    MilkEntry.aggregate([
      { $match: { date: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          avgFat: { $avg: '$fat' },
          quantity: { $sum: '$quantity' }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  const morning = todayAgg.find((x) => x._id === 'Morning') || { quantity: 0, amount: 0 };
  const evening = todayAgg.find((x) => x._id === 'Evening') || { quantity: 0, amount: 0 };
  const allTime = allTimeAgg[0] || { quantity: 0, amount: 0 };

  res.json({
    totalCustomers,
    todayMorningQty: round(morning.quantity),
    todayEveningQty: round(evening.quantity),
    todayTotalQty: round(morning.quantity + evening.quantity),
    todayRevenue: round(morning.amount + evening.amount),
    allTimeQty: round(allTime.quantity),
    allTimeRevenue: round(allTime.amount),
    monthlyTrend: monthlyTrend.map((m) => ({
      label: `${m._id.y}-${String(m._id.m).padStart(2, '0')}`,
      quantity: round(m.quantity),
      amount: round(m.amount)
    })),
    fatTrend: fatTrend.map((f) => ({
      date: f._id,
      avgFat: round(f.avgFat),
      quantity: round(f.quantity)
    }))
  });
});
