-- DropForeignKey
ALTER TABLE "HxRecord" DROP CONSTRAINT "HxRecord_appointmentId_fkey";

-- AlterTable
ALTER TABLE "HxRecord" ALTER COLUMN "appointmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "HxRecord" ADD CONSTRAINT "HxRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
