// backend/src/utils/password.util.js
import bcryptjs from 'bcryptjs';

const SALT_ROUNDS = 12;

export const passwordUtil = {
  hash: async (password) => {
    return bcryptjs.hash(password, SALT_ROUNDS);
  },

  compare: async (password, hash) => {
    return bcryptjs.compare(password, hash);
  },

  isStrong: (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  },
};

export default passwordUtil;
