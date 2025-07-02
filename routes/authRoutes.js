const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/authController');
const { loginLimiter, protect } = require('../middleware/auth');

/**
 * @desc    Login user with rate limiting
 * @route   POST /api/auth/login
 * @access  Public
 */
router.post('/login', 
  loginLimiter, // Batasi 5 percobaan login per 15 menit
  login
);

/**
 * @desc    Logout user (protected route)
 * @route   GET /api/auth/logout
 * @access  Private
 */
router.get('/logout',
  protect, // Wajib punya token valid
  logout
);

module.exports = router;