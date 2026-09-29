// backend/src/modules/transactions/transactions.service.js
import prisma from '../../prisma/client.js';

export const transactionsService = {
  list: async ({ type, category, from, to, page = 1, limit = 20 } = {}) => {
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (type) where.type = type;
    if (category) where.category = category;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) };
  },

  create: async (data) => {
    return prisma.transaction.create({
      data: {
        ...data,
        amount: Number(data.amount),
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  },

  getById: async (id) => {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!transaction) throw { statusCode: 404, message: 'Transacción no encontrada', code: 'NOT_FOUND' };
    return transaction;
  },

  getSummary: async ({ from, to } = {}) => {
    const where = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [incomeResult, expenseResult, byCategory] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    const income = incomeResult._sum.amount || 0;
    const expense = expenseResult._sum.amount || 0;

    return {
      income,
      expense,
      balance: income - expense,
      incomeCount: incomeResult._count,
      expenseCount: expenseResult._count,
      byCategory,
    };
  },
};

export default transactionsService;
