const { Types } = require('mongoose');
const AppError = require('../utils/errorResponse');

exports.checkObjectId = (req, res, next) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('ID tidak valid', 400));
  }
  next();
};