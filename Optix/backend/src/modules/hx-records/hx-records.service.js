// backend/src/modules/hx-records/hx-records.service.js
import prisma from '../../prisma/client.js';

// Rechaza códigos CIE-10 inexistentes antes de escribir, para no fallar a mitad del guardado
const assertCie10CodesExist = async (diagnoses) => {
  if (!diagnoses?.length) return;
  const codes = [...new Set(diagnoses.map((d) => d.cie10Code))];
  const found = await prisma.cie10Code.findMany({ where: { code: { in: codes } }, select: { code: true } });
  const missing = codes.filter((c) => !found.some((f) => f.code === c));
  if (missing.length) {
    throw { statusCode: 400, message: `Código CIE-10 no encontrado: ${missing.join(', ')}`, code: 'INVALID_CIE10' };
  }
};

export const hxRecordsService = {
  list: async ({ patientId, page = 1, limit = 20 } = {}) => {
    const skip = (Number(page) - 1) * Number(limit);
    const where = patientId ? { patientId } : {};
    const [data, total] = await Promise.all([
      prisma.hxRecord.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { id: true, name: true } },
          diagnoses: { include: { cie10: true } },
        },
      }),
      prisma.hxRecord.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) };
  },

  create: async (data) => {
    const { ophthalmology, diagnoses, prescriptions, ...recordData } = data;
    await assertCie10CodesExist(diagnoses);

    if (recordData.appointmentId) {
      const existing = await prisma.hxRecord.findUnique({ where: { appointmentId: recordData.appointmentId }, select: { id: true } });
      if (existing) throw { statusCode: 409, message: 'La cita ya tiene una historia clínica', code: 'HX_EXISTS' };
    }

    const record = await prisma.hxRecord.create({
      data: {
        ...recordData,
        ophthalmology: ophthalmology ? { create: ophthalmology } : undefined,
        diagnoses: diagnoses?.length
          ? { create: diagnoses }
          : undefined,
        prescriptions: prescriptions?.length
          ? { create: prescriptions }
          : undefined,
      },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true } },
        ophthalmology: true,
        diagnoses: { include: { cie10: true } },
        prescriptions: true,
      },
    });

    return record;
  },

  getById: async (id) => {
    const record = await prisma.hxRecord.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, specialty: true } },
        appointment: { select: { dateTime: true, appointmentType: true } },
        ophthalmology: true,
        diagnoses: { include: { cie10: true } },
        prescriptions: true,
        attachments: true,
      },
    });
    if (!record) throw { statusCode: 404, message: 'Historia clínica no encontrada', code: 'NOT_FOUND' };
    return record;
  },

  update: async (id, data) => {
    const existing = await hxRecordsService.getById(id);
    if (existing.status === 'FINALIZED') throw { statusCode: 409, message: 'La historia clínica ya está finalizada', code: 'ALREADY_FINALIZED' };

    const { ophthalmology, diagnoses, prescriptions, ...recordData } = data;
    await assertCie10CodesExist(diagnoses);

    // Todo o nada: un fallo no debe dejar diagnósticos o prescripciones borrados
    await prisma.$transaction(async (tx) => {
      // Actualizar datos básicos
      await tx.hxRecord.update({ where: { id }, data: recordData });

      // Actualizar oftalmología (upsert)
      if (ophthalmology) {
        await tx.hxOphthalmology.upsert({
          where: { hxRecordId: id },
          create: { ...ophthalmology, hxRecordId: id },
          update: ophthalmology,
        });
      }

      // Reemplazar diagnósticos
      if (diagnoses !== undefined) {
        await tx.diagnosis.deleteMany({ where: { hxRecordId: id } });
        if (diagnoses.length) {
          await tx.diagnosis.createMany({ data: diagnoses.map((d) => ({ ...d, hxRecordId: id })) });
        }
      }

      // Reemplazar prescripciones
      if (prescriptions !== undefined) {
        await tx.prescription.deleteMany({ where: { hxRecordId: id } });
        if (prescriptions.length) {
          await tx.prescription.createMany({ data: prescriptions.map((p) => ({ ...p, hxRecordId: id })) });
        }
      }
    });

    return hxRecordsService.getById(id);
  },

  finalize: async (id) => {
    const existing = await hxRecordsService.getById(id);
    if (existing.status === 'FINALIZED') throw { statusCode: 409, message: 'Ya está finalizada', code: 'ALREADY_FINALIZED' };
    return prisma.hxRecord.update({
      where: { id },
      data: { status: 'FINALIZED', finalizedAt: new Date() },
    });
  },
};

export default hxRecordsService;
