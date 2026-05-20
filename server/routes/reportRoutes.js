const express = require('express');
const router = express.Router();
const r = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/dashboard', r.dashboardStats);
router.get('/daily', r.dailyReport);
router.get('/10days', r.tenDayReport);
router.get('/monthly', r.monthlyReport);
router.get('/customer-diary', r.customerDiary);

module.exports = router;
