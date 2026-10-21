// backend/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpiar datos existentes
  console.log('🗑️  Limpiando datos anteriores...');
  await prisma.notification.deleteMany({});
  await prisma.hxAttachment.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.diagnosis.deleteMany({});
  await prisma.hxOphthalmology.deleteMany({});
  await prisma.hxRecord.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.cie10Code.deleteMany({});

  // Crear usuarios
  console.log('👤 Creando usuarios...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@optix.co',
      password: await bcryptjs.hash('Admin2026!', SALT_ROUNDS),
      name: 'Administrador',
      role: 'ADMIN',
      active: true,
    },
  });

  const doctor = await prisma.user.create({
    data: {
      email: 'medico@optix.co',
      password: await bcryptjs.hash('Doctor2026!', SALT_ROUNDS),
      name: 'Dr. Carlos López',
      role: 'DOCTOR',
      active: true,
      specialty: 'Oftalmología',
      licenseNumber: 'OFT-12345',
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      email: 'recepcion@optix.co',
      password: await bcryptjs.hash('Recep2026!', SALT_ROUNDS),
      name: 'María García',
      role: 'RECEPTIONIST',
      active: true,
    },
  });

  // Crear CIE-10 oftalmológicos
  console.log('📋 Creando diagnósticos CIE-10...');
  const cie10Codes = await Promise.all([
    prisma.cie10Code.create({
      data: {
        code: 'H52.00',
        description: 'Miopía',
        category: 'Oftalmología',
      },
    }),
    prisma.cie10Code.create({
      data: {
        code: 'H52.01',
        description: 'Hipermetropía',
        category: 'Oftalmología',
      },
    }),
    prisma.cie10Code.create({
      data: {
        code: 'H52.20',
        description: 'Astigmatismo',
        category: 'Oftalmología',
      },
    }),
    prisma.cie10Code.create({
      data: {
        code: 'H25.80',
        description: 'Cataratas',
        category: 'Oftalmología',
      },
    }),
    prisma.cie10Code.create({
      data: {
        code: 'H40.10',
        description: 'Glaucoma de ángulo abierto',
        category: 'Oftalmología',
      },
    }),
  ]);

  // Crear pacientes
  console.log('🏥 Creando pacientes...');
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        phoneNumber: '+573001234567',
        document: '1234567890',
        documentType: 'CC',
        birthDate: new Date('1990-05-15'),
        gender: 'M',
        address: 'Calle 10 # 5-20',
        city: 'Bogotá',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Ana',
        lastName: 'Martínez',
        email: 'ana@example.com',
        phoneNumber: '+573009876543',
        document: '9876543210',
        documentType: 'CC',
        birthDate: new Date('1985-08-22'),
        gender: 'F',
        address: 'Carrera 7 # 40-10',
        city: 'Medellín',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Roberto',
        lastName: 'García',
        email: 'roberto@example.com',
        phoneNumber: '+573105555555',
        document: '5555555555',
        documentType: 'CC',
        birthDate: new Date('1978-03-10'),
        gender: 'M',
        address: 'Avenida Paseo del Comercio',
        city: 'Cali',
      },
    }),
  ]);

  // Crear citas para hoy
  console.log('📅 Creando citas...');
  const today = new Date();
  today.setHours(9, 0, 0, 0);

  await Promise.all([
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctor.id,
        appointmentType: 'FIRST_VISIT',
        status: 'SCHEDULED',
        dateTime: new Date(today.getTime() + 0 * 60 * 60000), // 9 AM
        duration: 30,
        reason: 'Consulta oftalmológica inicial',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctor.id,
        appointmentType: 'FOLLOW_UP',
        status: 'CONFIRMED',
        dateTime: new Date(today.getTime() + 1 * 60 * 60000), // 10 AM
        duration: 30,
        reason: 'Seguimiento',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        doctorId: doctor.id,
        appointmentType: 'EXAM',
        status: 'WAITING',
        dateTime: new Date(today.getTime() + 2 * 60 * 60000), // 11 AM
        duration: 45,
        reason: 'Examen oftalmológico completo',
      },
    }),
  ]);

  // Crear transacciones demo
  console.log('💰 Creando transacciones...');
  await Promise.all([
    prisma.transaction.create({
      data: {
        patientId: patients[0].id,
        type: 'INCOME',
        category: 'CONSULTATION',
        amount: 150000,
        paymentMethod: 'CARD',
        description: 'Consulta oftalmológica',
      },
    }),
    prisma.transaction.create({
      data: {
        type: 'EXPENSE',
        category: 'SUPPLIES',
        amount: 250000,
        paymentMethod: 'TRANSFER',
        description: 'Compra de lentes de prueba',
      },
    }),
  ]);

  console.log('✅ Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
