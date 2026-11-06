/*
  Warnings:

  - A unique constraint covering the columns `[visitor_key,visit_date]` on the table `visitors` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "visitors" ADD COLUMN     "visit_date" DATE,
ADD COLUMN     "visitor_key" TEXT;

-- CreateIndex
CREATE INDEX "visitors_visit_date_country_idx" ON "visitors"("visit_date", "country");

-- CreateIndex
CREATE UNIQUE INDEX "visitors_visitor_key_visit_date_key" ON "visitors"("visitor_key", "visit_date");
