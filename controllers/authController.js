const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const bcrypt = require('bcryptjs');

// Helper untuk logging
const log = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args)
};

/**
 * @desc    Login admin
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  // 1. Validasi input
  if (!username?.trim() || !password) {
    log.warn('Login attempt with empty credentials');
    return next(new ErrorResponse('Username dan password harus diisi', 400));
  }

  const normalizedUsername = username.toLowerCase().trim();
  log.info(`Mencari admin: ${normalizedUsername}`);

  // 2. Cari admin di database
  let admin;
  try {
    admin = await User.findOne({ 
      username: normalizedUsername,
      role: 'admin' 
    }).select('+password');

    if (!admin) {
      log.warn(`Admin tidak ditemukan: ${normalizedUsername}`);
      return next(new ErrorResponse('Kredensial tidak valid', 401));
    }
  } catch (dbError) {
    log.error('Database error:', dbError);
    return next(new ErrorResponse('Terjadi kesalahan server', 500));
  }

  // 3. Verifikasi password
  let isMatch;
  try {
    isMatch = await bcrypt.compare(password, admin.password);
    log.info(`Password match: ${isMatch}`);
    
    if (!isMatch) {
      log.warn('Password tidak cocok untuk admin:', admin.username);
      return next(new ErrorResponse('Kredensial tidak valid', 401));
    }
  } catch (bcryptError) {
    log.error('Bcrypt error:', bcryptError);
    return next(new ErrorResponse('Terjadi kesalahan server', 500));
  }

  // 4. Generate JWT Token
  let token;
  try {
    token = jwt.sign(
      { 
        id: admin._id,
        role: admin.role,
        username: admin.username 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRE || '1h' 
      }
    );
  } catch (jwtError) {
    log.error('JWT error:', jwtError);
    return next(new ErrorResponse('Gagal membuat token', 500));
  }

  // 5. Update last login
  try {
    admin.terakhirLogin = Date.now();
    await admin.save();
    log.info(`Admin ${admin.username} berhasil login`);
  } catch (updateError) {
    log.error('Gagal update last login:', updateError);
    // Lanjutkan meskipun gagal update last login
  }

  // 6. Kirim response
  res
    .status(200)
    .cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 jam
    })
    .json({
      success: true,
      token,
      user: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        terakhirLogin: admin.terakhirLogin
      }
    });
});

/**
 * @desc    Logout admin
 * @route   GET /api/auth/logout
 * @access  Private (Admin)
 */
exports.logout = asyncHandler(async (req, res, next) => {
  res
    .status(200)
    .clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
    .json({
      success: true,
      message: 'Logout berhasil'
    });
});

/**
 * @desc    Get current admin data
 * @route   GET /api/auth/me
 * @access  Private (Admin)
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      log.warn(`User tidak ditemukan: ${req.user.id}`);
      return next(new ErrorResponse('User tidak ditemukan', 404));
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    log.error('Error getMe:', error);
    next(new ErrorResponse('Terjadi kesalahan server', 500));
  }
});