/*
  Warnings:

  - You are about to drop the column `driver_room` on the `apartments` table. All the data in the column will be lost.
  - You are about to drop the column `entrance` on the `apartments` table. All the data in the column will be lost.
  - You are about to drop the column `garden` on the `apartments` table. All the data in the column will be lost.
  - You are about to drop the column `kitchen` on the `apartments` table. All the data in the column will be lost.
  - You are about to drop the column `living_room` on the `apartments` table. All the data in the column will be lost.
  - You are about to drop the column `majlis` on the `apartments` table. All the data in the column will be lost.
  - You are about to drop the column `roof` on the `apartments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "apartments" DROP COLUMN "driver_room",
DROP COLUMN "entrance",
DROP COLUMN "garden",
DROP COLUMN "kitchen",
DROP COLUMN "living_room",
DROP COLUMN "majlis",
DROP COLUMN "roof";
