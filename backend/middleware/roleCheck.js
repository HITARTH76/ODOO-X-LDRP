module.exports = (roles = []) => {
  // roles can be a single string or an array of strings
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: This action requires one of the following roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};
