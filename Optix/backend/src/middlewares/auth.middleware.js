// backend/src/middlewares/auth.middleware.js
import jwtUtil from '../utils/jwt.util.js';
import prisma from '../prisma/client.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token no proporcionado',
        code: 'UNAUTHORIZED',
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwtUtil.verify(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || !user.active) {
      return res.status(401).json({
        error: 'Usuario no encontrado o inactivo',
        code: 'UNAUTHORIZED',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido o expirado',
      code: 'UNAUTHORIZED',
    });
  }
};

export default authMiddleware;
