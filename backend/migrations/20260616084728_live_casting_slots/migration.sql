/*
  Warnings:

  - You are about to drop the column `event_end_time` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `event_start_time` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "slot_id" TEXT;

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "event_end_time",
DROP COLUMN "event_start_time",
ADD COLUMN     "daily_end_time" TEXT,
ADD COLUMN     "daily_start_time" TEXT;

-- CreateTable
CREATE TABLE "casting_slots" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "slot_date" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casting_slots_pkey" PRIMARY KEY ("id")
);
