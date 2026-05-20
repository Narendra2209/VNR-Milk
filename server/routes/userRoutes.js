const express = require('express');
const router = express.Router();
const u = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth, requireAdmin);

router.get('/', u.listUsers);
router.post('/', u.createUser);
router.put('/:id', u.updateUser);
router.delete('/:id', u.deleteUser);

module.exports = router;
