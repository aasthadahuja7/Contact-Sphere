// catch-all error handler — express needs all 4 params here
const errorHandler = (err, req, res, next) => {
  let code = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(code).json({
    message: err.message,
    // don't send stack traces in prod
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = errorHandler;
