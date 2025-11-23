/*
  Warnings:

  - A unique constraint covering the columns `[macAddress]` on the table `devices` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "ip" TEXT,
ADD COLUMN     "macAddress" TEXT,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "openPorts" TEXT,
ADD COLUMN     "sshPort" TEXT NOT NULL DEFAULT '22',
ALTER COLUMN "status" SET DEFAULT 'down';

-- CreateTable
CREATE TABLE "pairing_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "deviceId" TEXT,
    "dongleId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pairing_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pairing_sessions_sessionId_key" ON "pairing_sessions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "devices_macAddress_key" ON "devices"("macAddress");
