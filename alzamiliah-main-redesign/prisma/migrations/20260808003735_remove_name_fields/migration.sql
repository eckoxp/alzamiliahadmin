/*
  Warnings:

  - You are about to drop the column `apartment_number` on the `apartments` table. All the data in the column will be lost.
  - You are about to drop the column `name_ar` on the `apartments` table. All the data in the column will be lost.
  - You are about to drop the column `name_en` on the `apartments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "apartments" DROP COLUMN "apartment_number",
DROP COLUMN "name_ar",
DROP COLUMN "name_en";
