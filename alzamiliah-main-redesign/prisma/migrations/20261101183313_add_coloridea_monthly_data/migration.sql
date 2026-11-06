/*
  Warnings:

  - A unique constraint covering the columns `[external_project_id]` on the table `projects` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProjectDataSource" AS ENUM ('COLORIDEA', 'MANUAL');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "external_project_id" TEXT,
ADD COLUMN     "last_synced_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "project_monthly_data" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "source" "ProjectDataSource" NOT NULL,
    "external_project_id" TEXT,
    "origin_note" TEXT,
    "report" JSONB,
    "outputs" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_monthly_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_phases" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "monthly_data_id" INTEGER NOT NULL,
    "is_latest" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_timelapse_items" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "external_project_id" TEXT NOT NULL,
    "external_item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "link" TEXT,
    "photo" TEXT,
    "date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_timelapse_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_monthly_data_project_id_month_idx" ON "project_monthly_data"("project_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "project_monthly_data_project_id_month_external_project_id_key" ON "project_monthly_data"("project_id", "month", "external_project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_phases_monthly_data_id_key" ON "project_phases"("monthly_data_id");

-- CreateIndex
CREATE INDEX "project_phases_project_id_idx" ON "project_phases"("project_id");

-- CreateIndex
CREATE INDEX "project_timelapse_items_project_id_idx" ON "project_timelapse_items"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_timelapse_items_project_id_external_item_id_key" ON "project_timelapse_items"("project_id", "external_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_external_project_id_key" ON "projects"("external_project_id");

-- AddForeignKey
ALTER TABLE "project_monthly_data" ADD CONSTRAINT "project_monthly_data_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_phases" ADD CONSTRAINT "project_phases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_phases" ADD CONSTRAINT "project_phases_monthly_data_id_fkey" FOREIGN KEY ("monthly_data_id") REFERENCES "project_monthly_data"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_timelapse_items" ADD CONSTRAINT "project_timelapse_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;


CREATE UNIQUE INDEX "project_phases_one_latest_per_project"
ON "project_phases" ("project_id") WHERE "is_latest" = true;