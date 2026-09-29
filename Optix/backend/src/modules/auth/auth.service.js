// backend/src/modules/auth/auth.service.js
import prisma from '../../prisma/client.js';
import passwordUtil from '../../utils/password.util.js';
import jwtUtil from '../../utils/jwt.util.js';

export const authService = {
  login: async (email, password) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw {
        statusCode: 401,
        message: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS',
      };
    }

    const isPasswordValid = await passwordUtil.compare(password, user.password);

    if (!isPasswordValid) {
      throw {
        statusCode: 401,
        message: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS',
      };
    }

    if (!user.active) {
      throw {
        statusCode: 403,
        message: 'Usuario inactivo',
        code: 'USER_INACTIVE',
      };
    }

    const accessToken = jwtUtil.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = jwtUtil.signRefresh({
      sub: user.id,
      type: 'refresh',
    });

    // Guardar refresh token en BD
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  },

  refresh: async (refreshTokenString) => {
    try {
      jwtUtil.verifyRefresh(refreshTokenString);
    } catch (error) {
      throw {
        statusCode: 401,
        message: 'Refresh token inválido',
        code: 'INVALID_REFRESH_TOKEN',
      };
    }

    // Buscar token en BD
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw {
        statusCode: 401,
        message: 'Refresh token expirado',
        code: 'REFRESH_TOKEN_EXPIRED',
      };
    }

    const user = storedToken.user;

    if (!user.active) {
      throw {
        statusCode: 403,
        message: 'Usuario inactivo',
        code: 'USER_INACTIVE',
      };
    }

    // Generar nuevo access token
    const newAccessToken = jwtUtil.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Rotar refresh token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const newRefreshToken = jwtUtil.signRefresh({
      sub: user.id,
      type: 'refresh',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  logout: async (userId) => {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
    return { success: true };
  },

  getMe: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
        specialty: true,
        createdAt: true,
      },
    });

    return user;
  },
};

export default authService;
