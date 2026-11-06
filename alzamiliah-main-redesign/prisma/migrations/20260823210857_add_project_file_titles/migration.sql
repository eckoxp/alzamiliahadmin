/*
  Warnings:

  - You are about to drop the column `video_link` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projects" DROP COLUMN "video_link",
ADD COLUMN     "project_file2_title_ar" TEXT,
ADD COLUMN     "project_file2_title_en" TEXT,
ADD COLUMN     "project_file3_title_ar" TEXT,
ADD COLUMN     "project_file3_title_en" TEXT,
ADD COLUMN     "project_file_title_ar" TEXT,
ADD COLUMN     "project_file_title_en" TEXT;
