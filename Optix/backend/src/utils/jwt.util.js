// backend/src/utils/jwt.util.js
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { jwtConfig } from '../config/security.js';

export const jwtUtil = {
  sign: (payload) => {
    return jwt.sign({ ...payload, jti: randomUUID() }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });
  },

  signRefresh: (payload) => {
    return jwt.sign({ ...payload, jti: randomUUID() }, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    });
  },

  verify: (token) => {
    try {
      return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  },

  verifyRefresh: (token) => {
    try {
      return jwt.verify(token, jwtConfig.refreshSecret);
    } catch (error) {
      throw new Error('Refresh token inválido o expirado');
    }
  },

  decode: (token) => {
    return jwt.decode(token);
  },
};

export default jwtUtil;
