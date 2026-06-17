-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "event_end_time" TIMESTAMP(3),
ADD COLUMN     "event_start_time" TIMESTAMP(3),
ADD COLUMN     "project_gallery" TEXT,
ADD COLUMN     "slot_duration_minutes" INTEGER;
