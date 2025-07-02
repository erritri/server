const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/Users');
const logger = require('../utils/logger');

// ===================== RATE LIMITER ===================== //
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 20,
  message: 'Terlalu banyak percobaan login. Coba lagi setelah 15 menit.',
  handler: (req, res, next) => {
    logger.warn('Rate limit exceeded for login attempts', {
      ip: req.ip,
      endpoint: req.originalUrl
    });
    res.status(429).json({
      success: false,
      error: 'Terlalu banyak percobaan login. Coba lagi nanti.'
    });
  }
});

// ===================== AUTHENTICATION ===================== //
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorResponse('Akses ditolak', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    next(new ErrorResponse('Token tidak valid', 401));
  }
};

// ===================== AUTHORIZATION ===================== //
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new ErrorResponse('Hanya admin yang diizinkan', 403));
  }
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new ErrorResponse(`Akses ditolak untuk role ${req.user?.role || 'tidak diketahui'}`, 403));
    }
    next();
  };
};

// ===================== EKSPOR ===================== //
module.exports = {
  loginLimiter, // Pastikan ini diekspor
  protect,
  adminOnly,
  authorize
};