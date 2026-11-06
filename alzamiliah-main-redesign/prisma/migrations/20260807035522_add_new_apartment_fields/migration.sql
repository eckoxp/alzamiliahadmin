/*
  Warnings:

  - A unique constraint covering the columns `[project_id,unit_code]` on the table `apartments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('PHONE', 'WHATSAPP', 'EMAIL');

-- AlterTable
ALTER TABLE "apartments" ADD COLUMN     "apartment_number" INTEGER,
ADD COLUMN     "balcony" INTEGER DEFAULT 0,
ADD COLUMN     "building_area" DOUBLE PRECISION,
ADD COLUMN     "direction" TEXT,
ADD COLUMN     "driver_room" INTEGER DEFAULT 0,
ADD COLUMN     "entrance" INTEGER DEFAULT 0,
ADD COLUMN     "garden" INTEGER DEFAULT 0,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "kitchen" INTEGER DEFAULT 0,
ADD COLUMN     "laundry" INTEGER DEFAULT 0,
ADD COLUMN     "living_room" INTEGER DEFAULT 0,
ADD COLUMN     "maid_bathroom" INTEGER,
ADD COLUMN     "maid_room" INTEGER DEFAULT 0,
ADD COLUMN     "majlis" INTEGER DEFAULT 0,
ADD COLUMN     "parking" INTEGER DEFAULT 0,
ADD COLUMN     "roof" INTEGER DEFAULT 0,
ADD COLUMN     "roof_area" DOUBLE PRECISION,
ADD COLUMN     "storage" INTEGER DEFAULT 0,
ADD COLUMN     "type" TEXT DEFAULT 'A',
ADD COLUMN     "unit_code" TEXT,
ADD COLUMN     "view" TEXT;

-- CreateTable
CREATE TABLE "qr_code_leads" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "contact_method" "ContactMethod" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_code_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_code_lead_projects" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,

    CONSTRAINT "qr_code_lead_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_pages" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "content_ar" TEXT NOT NULL,
    "content_en" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qr_code_lead_projects_lead_id_project_id_key" ON "qr_code_lead_projects"("lead_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_pages_slug_key" ON "content_pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "apartments_project_id_unit_code_key" ON "apartments"("project_id", "unit_code");

-- AddForeignKey
ALTER TABLE "qr_code_lead_projects" ADD CONSTRAINT "qr_code_lead_projects_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "qr_code_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_code_lead_projects" ADD CONSTRAINT "qr_code_lead_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
