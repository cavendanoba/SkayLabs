// backend/src/modules/appointments/appointments.service.js
import prisma from '../../prisma/client.js';

export const appointmentsService = {
  list: async ({ date, doctorId, status, patientId, page = 1, limit = 20 } = {}) => {
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = { in: status.split(',').map((s) => s.trim()) };
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.dateTime = { gte: start, lte: end };
    }

    const [data, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { dateTime: 'asc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, phoneNumber: true } },
          doctor: { select: { id: true, name: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) };
  },

  create: async (data) => {
    // Verificar conflictos de horario
    const dateTime = new Date(data.dateTime);
    const endTime = new Date(dateTime.getTime() + (data.duration || 30) * 60000);

    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        AND: [
          { dateTime: { lt: endTime } },
          {
            dateTime: {
              gte: new Date(dateTime.getTime() - 60 * 60000),
            },
          },
        ],
      },
    });

    if (conflict) {
      const conflictEnd = new Date(conflict.dateTime.getTime() + conflict.duration * 60000);
      if (dateTime < conflictEnd) {
        throw { statusCode: 409, message: 'El médico ya tiene una cita en ese horario', code: 'SCHEDULE_CONFLICT' };
      }
    }

    return prisma.appointment.create({
      data: { ...data, dateTime },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, name: true } },
      },
    });
  },

  getById: async (id) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, specialty: true } },
        hxRecord: true,
      },
    });
    if (!appointment) throw { statusCode: 404, message: 'Cita no encontrada', code: 'NOT_FOUND' };
    return appointment;
  },

  updateStatus: async (id, status) => {
    await appointmentsService.getById(id);
    return prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, name: true } },
      },
    });
  },

  reschedule: async (id, data) => {
    const existing = await appointmentsService.getById(id);
    const dateTime = new Date(data.dateTime);
    return prisma.appointment.update({
      where: { id },
      data: {
        dateTime,
        duration: data.duration || existing.duration,
        notes: data.notes || existing.notes,
        status: 'SCHEDULED',
      },
    });
  },

  getAvailability: async (doctorId, date) => {
    if (!doctorId || !date) throw { statusCode: 400, message: 'doctorId y date son requeridos', code: 'MISSING_PARAMS' };

    const start = new Date(date);
    start.setHours(7, 0, 0, 0);
    const end = new Date(date);
    end.setHours(19, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        dateTime: { gte: start, lte: end },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: { dateTime: true, duration: true, status: true },
      orderBy: { dateTime: 'asc' },
    });

    return { date, doctorId, booked: appointments };
  },
};

export default appointmentsService;
