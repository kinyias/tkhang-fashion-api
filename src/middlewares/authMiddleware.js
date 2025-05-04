// Authentication middleware
const passport = require('passport');

// JWT authentication middleware
function authenticate(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = user;
    next();
  })(req, res, next);
}

// Role-based authorization middleware
function authorize(roles = []) {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return [
    authenticate,
    (req, res, next) => {
      if (roles.length && !roles.includes(req.user.vai_tro)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    }
  ];
}

module.exports = {
  authenticate,
  authorize
};