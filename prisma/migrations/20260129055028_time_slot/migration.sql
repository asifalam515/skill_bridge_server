/*
  Warnings:

  - A unique constraint covering the columns `[tutorId,startTime]` on the table `AvailabilitySlot` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tutorId,endTime]` on the table `AvailabilitySlot` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_tutorId_startTime_key" ON "AvailabilitySlot"("tutorId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_tutorId_endTime_key" ON "AvailabilitySlot"("tutorId", "endTime");
