const express = require('express');
const router = express.Router();
const a = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', a.login);
router.get('/me', requireAuth, a.me);

module.exports = router;
