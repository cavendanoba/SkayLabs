// backend/src/middlewares/roles.middleware.js
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autenticado',
        code: 'UNAUTHORIZED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'No tiene permisos para esta acción',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};

export default requireRole;
