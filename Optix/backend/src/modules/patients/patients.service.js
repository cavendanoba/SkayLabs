// backend/src/modules/patients/patients.service.js
import prisma from '../../prisma/client.js';

export const patientsService = {
  list: async ({ search = '', page = 1, limit = 20 } = {}) => {
    const skip = (Number(page) - 1) * Number(limit);
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { document: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
            { phoneNumber: { contains: search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { lastName: 'asc' },
      }),
      prisma.patient.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) };
  },

  create: async (data) => {
    const exists = await prisma.patient.findUnique({ where: { document: data.document } });
    if (exists) throw { statusCode: 409, message: 'Ya existe un paciente con ese documento', code: 'DOCUMENT_EXISTS' };

    if (data.email === '') delete data.email;
    if (data.birthDate) data.birthDate = new Date(data.birthDate);

    return prisma.patient.create({ data });
  },

  getById: async (id) => {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { dateTime: 'desc' },
          take: 5,
          include: { doctor: { select: { name: true } } },
        },
        hxRecords: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!patient) throw { statusCode: 404, message: 'Paciente no encontrado', code: 'NOT_FOUND' };
    return patient;
  },

  update: async (id, data) => {
    await patientsService.getById(id);
    if (data.birthDate) data.birthDate = new Date(data.birthDate);
    if (data.email === '') data.email = null;
    return prisma.patient.update({ where: { id }, data });
  },
};

export default patientsService;
