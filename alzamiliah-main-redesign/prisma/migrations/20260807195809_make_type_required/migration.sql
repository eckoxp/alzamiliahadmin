/*
  Warnings:

  - Made the column `type` on table `apartments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "apartments" ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'شقة';
