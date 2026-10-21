// backend/src/config/security.js
import env from './env.js';

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export const jwtConfig = {
  secret: env.JWT_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  expiresIn: env.JWT_EXPIRY,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRY,
};

export const cookieConfig = {
  httpOnly: true,
  secure: env.isProduction(),
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

export default { securityHeaders, jwtConfig, cookieConfig };
