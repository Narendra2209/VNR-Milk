const express = require('express');
const router = express.Router();
const d = require('../controllers/dairyController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', d.listDairies);
router.post('/', requireAdmin, d.createDairy);
router.put('/:id', requireAdmin, d.updateDairy);
router.delete('/:id', requireAdmin, d.deleteDairy);

module.exports = router;
