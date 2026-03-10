exports.catchErrors = (fn) => {
  return function (req, res, next) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

exports.notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

exports.developmentErrors = (err, req, res, _next) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    result: null,
    message: err.message,
    stack: err.stack,
    statusCode,
  });
};

exports.productionErrors = (err, req, res, _next) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    result: null,
    message: statusCode === 500 ? 'An internal server error occurred.' : err.message,
    statusCode,
  });
};
