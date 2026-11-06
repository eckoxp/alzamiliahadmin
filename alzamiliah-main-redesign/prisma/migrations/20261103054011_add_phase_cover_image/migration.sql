/*
  Warnings:

  - Added the required column `cover_image` to the `project_phases` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "project_phases" ADD COLUMN     "cover_image" TEXT NOT NULL;
