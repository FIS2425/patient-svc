import logger from '../config/logger.js';

export const verifyAdmin = (req, res, next) => {
  if (req.user.roles.includes('admin') || req.user.roles.includes('doctor')) {
    console.log("El usuario es un admin")
    next();
  } else {
    logger.error('User is not an admin', {
      method: req.method,
      url: req.originalUrl,
      ip: req.headers && req.headers['x-forwarded-for'] || req.ip
    });
    res.status(403).json({ message: 'Forbidden' });
  }
}