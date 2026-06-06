const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied' });
  }

  // Check if Bearer token
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7, authHeader.length) 
    : authHeader;

  if (!token) {
    return res.status(401).json({ message: 'No token found in Bearer structure' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretvendorbridgekey12345');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};
