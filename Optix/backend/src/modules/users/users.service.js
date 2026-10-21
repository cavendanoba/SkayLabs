// backend/src/modules/users/users.service.js
import prisma from '../../prisma/client.js';
import passwordUtil from '../../utils/password.util.js';

const safeUser = (u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, active: u.active, phoneNumber: u.phoneNumber, specialty: u.specialty, licenseNumber: u.licenseNumber, createdAt: u.createdAt });

export const usersService = {
  list: async () => {
    const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
    return users.map(safeUser);
  },

  create: async (data) => {
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw { statusCode: 409, message: 'El email ya está registrado', code: 'EMAIL_EXISTS' };
    const password = await passwordUtil.hash(data.password);
    const user = await prisma.user.create({ data: { ...data, password } });
    return safeUser(user);
  },

  getById: async (id) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw { statusCode: 404, message: 'Usuario no encontrado', code: 'NOT_FOUND' };
    return safeUser(user);
  },

  update: async (id, data) => {
    await usersService.getById(id);
    const user = await prisma.user.update({ where: { id }, data });
    return safeUser(user);
  },

  updateStatus: async (id, active) => {
    await usersService.getById(id);
    const user = await prisma.user.update({ where: { id }, data: { active } });
    return safeUser(user);
  },
};

export default usersService;
