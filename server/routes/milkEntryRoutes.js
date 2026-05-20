const express = require('express');
const router = express.Router();
const m = require('../controllers/milkEntryController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', m.getMilkEntries);
router.post('/', m.createMilkEntry);

module.exports = router;
