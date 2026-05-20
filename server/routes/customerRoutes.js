const express = require('express');
const router = express.Router();
const c = require('../controllers/customerController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', c.getCustomers);
router.get('/:serialNumber', c.getCustomerBySerial);
router.post('/', c.createCustomer);
router.put('/:id', c.updateCustomer);
router.delete('/:id', requireAdmin, c.deleteCustomer);

module.exports = router;
