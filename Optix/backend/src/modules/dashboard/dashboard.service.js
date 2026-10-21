// backend/src/modules/dashboard/dashboard.service.js
import prisma from '../../prisma/client.js';

export const dashboardService = {
  getToday: async () => {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    const [appointments, income, newPatients] = await Promise.all([
      prisma.appointment.findMany({
        where: { dateTime: { gte: start, lte: end } },
        orderBy: { dateTime: 'asc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { id: true, name: true } },
        },
      }),
      prisma.transaction.aggregate({
        where: { type: 'INCOME', createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.patient.count({ where: { createdAt: { gte: start, lte: end } } }),
    ]);

    const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
    const total = appointments.length;

    return {
      appointments,
      totalAppointments: total,
      completedAppointments: completed,
      cancelledAppointments: appointments.filter((a) => a.status === 'CANCELLED').length,
      pendingAppointments: appointments.filter((a) => ['SCHEDULED', 'CONFIRMED', 'WAITING', 'IN_PROGRESS'].includes(a.status)).length,
      attendanceRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      incomeToday: Number(income._sum.amount || 0),
      newPatientsToday: newPatients,
    };
  },

  getSummary: async () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalPatients,
      totalAppointments,
      appointmentsToday,
      incomeThisMonth,
      appointmentsLastSevenDays,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { dateTime: { gte: todayStart, lte: todayEnd } } }),
      prisma.transaction.aggregate({
        where: { type: 'INCOME', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      // Últimos 7 días: agrupar por fecha
      prisma.$queryRaw`
        SELECT DATE("dateTime") as date, COUNT(*) as count
        FROM "Appointment"
        WHERE "dateTime" >= ${startOfWeek}
        GROUP BY DATE("dateTime")
        ORDER BY DATE("dateTime") ASC
      `,
    ]);

    return {
      totalPatients,
      totalAppointments,
      appointmentsToday,
      incomeThisMonth: Number(incomeThisMonth._sum.amount || 0),
      appointmentsLastSevenDays: appointmentsLastSevenDays.map((row) => ({
        date: row.date,
        count: Number(row.count),
      })),
    };
  },

  getTopDiagnoses: async (limit = 10) => {
    const diagnoses = await prisma.diagnosis.groupBy({
      by: ['cie10Code'],
      _count: { cie10Code: true },
      orderBy: { _count: { cie10Code: 'desc' } },
      take: Number(limit),
    });

    const codes = diagnoses.map((d) => d.cie10Code);
    const cie10Data = await prisma.cie10Code.findMany({
      where: { code: { in: codes } },
    });

    const cie10Map = new Map(cie10Data.map((c) => [c.code, c]));

    return diagnoses.map((d) => ({
      code: d.cie10Code,
      count: d._count.cie10Code,
      description: cie10Map.get(d.cie10Code)?.description || d.cie10Code,
      category: cie10Map.get(d.cie10Code)?.category || 'General',
    }));
  },
};

export default dashboardService;
