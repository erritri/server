/**
 * Async handler wrapper untuk route controllers
 * - Menghindari try-catch berulang di controllers
 * - Memastikan error diteruskan ke error handling middleware
 * 
 * @param {Function} fn - Fungsi async controller (req, res, next) 
 * @returns {Function} Middleware function yang sudah di-wrap
 */
const asyncHandler = (fn) => (req, res, next) => {
  // Jika function mengembalikan Promise (async), otomatis handle rejection
  // Jika sync function, tangkap error dengan try-catch
  Promise.resolve(fn(req, res, next))
    .catch((error) => {
      // Log error dengan konteks request
      console.error(`[AsyncHandler] ${req.method} ${req.originalUrl}`, {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        body: req.body,
        params: req.params
      });
      
      // Teruskan ke error middleware (pastikan sudah ada di app.js)
      next(error);
    });
};

module.exports = asyncHandler;