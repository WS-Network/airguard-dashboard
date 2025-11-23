/*
  Warnings:

  - You are about to drop the column `ip` on the `devices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "devices" DROP COLUMN "ip",
ADD COLUMN     "altitude" DOUBLE PRECISION,
ADD COLUMN     "bandwidth" TEXT,
ADD COLUMN     "channel" TEXT,
ADD COLUMN     "dns1" TEXT,
ADD COLUMN     "dns2" TEXT,
ADD COLUMN     "gateway" TEXT,
ADD COLUMN     "gpsAccuracy" DOUBLE PRECISION,
ADD COLUMN     "gpsConfigured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "heading" DOUBLE PRECISION,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "managedBy" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "securityType" TEXT,
ADD COLUMN     "sshConfigured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sshPasswordHash" TEXT,
ADD COLUMN     "sshUsername" TEXT,
ADD COLUMN     "ssid" TEXT,
ADD COLUMN     "subnetMask" TEXT,
ALTER COLUMN "status" SET DEFAULT 'offline';

-- CreateTable
CREATE TABLE "gps_logs" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "heading" DOUBLE PRECISION NOT NULL,
    "syncMethod" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gps_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gps_logs_deviceId_idx" ON "gps_logs"("deviceId");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_managedBy_fkey" FOREIGN KEY ("managedBy") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gps_logs" ADD CONSTRAINT "gps_logs_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
