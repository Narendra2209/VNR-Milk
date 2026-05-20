const express = require('express');
const router = express.Router();
const d = require('../controllers/dairyEntryController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', d.getDairyEntries);
router.post('/', d.createDairyEntry);
router.put('/:id', d.updateDairyEntry);
router.delete('/:id', requireAdmin, d.deleteDairyEntry);

module.exports = router;
