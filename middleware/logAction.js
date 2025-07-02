const logger = require('../utils/logger');

module.exports = (actionType) => {
  return (req, res, next) => {
    const logData = {
      action: actionType,
      user: req.user.id,
      ip: req.ip,
      method: req.method,
      path: req.originalUrl
    };

    if (req.params.id) logData.targetId = req.params.id;
    if (req.file) logData.file = req.file.filename;

    logger.info('Admin Action', logData);
    next();
  };
};