import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
const JWT_SECRET= process.env.NODE_ENV=='test'? process.env.VITE_JWT_SECRET:process.env.JWT_SECRET;

export const verifyAuth = (req, res, next) => {
  const token = req.cookies.token ? req.cookies.token : (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  console.log("El token es: ", token);
  if (!token) {
    logger.error('Error on token validation', {
      method: req.method,
      url: req.originalUrl,
      ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
      error: 'Access denied: No token provided',
    });
    return res.status(401).send({ error: 'Access denied: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("El token decodificado es: ", decoded)
    console.log("Los roles son: ", decoded.roles)
    if (!decoded.roles.includes('doctor') && !decoded.roles.includes('admin')) {
      logger.error('Error on token validation', {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
        userId: decoded.userId,
        error: 'Access denied. Insufficient permissions.',
        roles: decoded.roles
      });
      return res.status(403).send({ error: 'Access denied: Insufficient permissions' });
    }
    console.log("El token decodificado es: ", decoded)
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Error on token validation', {
      method: req.method,
      url: req.originalUrl,
      ip: req.headers && req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
      error: error.message
    });
    res.status(400).send({ error: 'Invalid token', message: error.message });
  }
};