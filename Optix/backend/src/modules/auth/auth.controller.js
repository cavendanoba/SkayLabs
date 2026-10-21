// backend/src/modules/auth/auth.controller.js
import authService from './auth.service.js';

export const authController = {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.validated.body;
      const result = await authService.login(email, password);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  refresh: async (req, res, next) => {
    try {
      const { refreshToken } = req.validated.body;
      const result = await authService.refresh(refreshToken);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res, next) => {
    try {
      await authService.logout(req.user.id);

      res.json({ success: true, message: 'Sesión cerrada' });
    } catch (error) {
      next(error);
    }
  },

  getMe: async (req, res, next) => {
    try {
      const user = await authService.getMe(req.user.id);

      res.json(user);
    } catch (error) {
      next(error);
    }
  },
};

export default authController;
