-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('FIRST_VISIT', 'FOLLOW_UP', 'URGENT', 'PROCEDURE', 'EXAM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('ALL', 'WHATSAPP', 'SMS', 'EMAIL', 'NONE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('CONSULTATION', 'PROCEDURE', 'EXAM', 'RENT', 'SALARY', 'SUPPLIES', 'EQUIPMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CC', 'CE', 'PA', 'RC', 'TI', 'NIT');

-- CreateEnum
CREATE TYPE "HxRecordStatus" AS ENUM ('DRAFT', 'FINALIZED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'RECEPTIONIST',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "phoneNumber" TEXT,
    "specialty" TEXT,
    "licenseNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "document" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "city" TEXT,
    "neighborhood" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentType" "AppointmentType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "dateTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HxRecord" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "status" "HxRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "chiefComplaint" TEXT,
    "medicalHistory" TEXT,
    "surgicalHistory" TEXT,
    "allergies" TEXT,
    "medications" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finalizedAt" TIMESTAMP(3),

    CONSTRAINT "HxRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HxOphthalmology" (
    "id" TEXT NOT NULL,
    "hxRecordId" TEXT NOT NULL,
    "visualAcuityOD" TEXT,
    "visualAcuityOS" TEXT,
    "refractionOD" TEXT,
    "refractionOS" TEXT,
    "intraocularPressureOD" DOUBLE PRECISION,
    "intraocularPressureOS" DOUBLE PRECISION,
    "biomicroscopyOD" TEXT,
    "biomicroscopyOS" TEXT,
    "fundusOD" TEXT,
    "fundusOS" TEXT,
    "plan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HxOphthalmology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "hxRecordId" TEXT NOT NULL,
    "cie10Code" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "hxRecordId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HxAttachment" (
    "id" TEXT NOT NULL,
    "hxRecordId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HxAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cie10Code" (
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cie10Code_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "type" "TransactionType" NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "description" TEXT,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "patientId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'ALL',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_email_key" ON "Patient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_document_key" ON "Patient"("document");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_idx" ON "Appointment"("doctorId");

-- CreateIndex
CREATE INDEX "Appointment_dateTime_idx" ON "Appointment"("dateTime");

-- CreateIndex
CREATE UNIQUE INDEX "HxRecord_appointmentId_key" ON "HxRecord"("appointmentId");

-- CreateIndex
CREATE INDEX "HxRecord_patientId_idx" ON "HxRecord"("patientId");

-- CreateIndex
CREATE INDEX "HxRecord_doctorId_idx" ON "HxRecord"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "HxOphthalmology_hxRecordId_key" ON "HxOphthalmology"("hxRecordId");

-- CreateIndex
CREATE INDEX "Diagnosis_hxRecordId_idx" ON "Diagnosis"("hxRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "Diagnosis_hxRecordId_cie10Code_key" ON "Diagnosis"("hxRecordId", "cie10Code");

-- CreateIndex
CREATE INDEX "Prescription_hxRecordId_idx" ON "Prescription"("hxRecordId");

-- CreateIndex
CREATE INDEX "HxAttachment_hxRecordId_idx" ON "HxAttachment"("hxRecordId");

-- CreateIndex
CREATE INDEX "Transaction_patientId_idx" ON "Transaction"("patientId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HxRecord" ADD CONSTRAINT "HxRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HxRecord" ADD CONSTRAINT "HxRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HxRecord" ADD CONSTRAINT "HxRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HxOphthalmology" ADD CONSTRAINT "HxOphthalmology_hxRecordId_fkey" FOREIGN KEY ("hxRecordId") REFERENCES "HxRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_hxRecordId_fkey" FOREIGN KEY ("hxRecordId") REFERENCES "HxRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_cie10Code_fkey" FOREIGN KEY ("cie10Code") REFERENCES "Cie10Code"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_hxRecordId_fkey" FOREIGN KEY ("hxRecordId") REFERENCES "HxRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HxAttachment" ADD CONSTRAINT "HxAttachment_hxRecordId_fkey" FOREIGN KEY ("hxRecordId") REFERENCES "HxRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
