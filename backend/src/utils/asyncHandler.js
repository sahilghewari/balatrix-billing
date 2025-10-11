/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass to error handling middleware
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
module.exports.asyncHandler = asyncHandler;
module.exports.default = asyncHandler;
