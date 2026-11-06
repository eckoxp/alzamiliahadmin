/*
  Warnings:

  - You are about to drop the column `sheet_webhook_secret` on the `projects` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "projects_sheet_webhook_secret_key";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "sheet_webhook_secret";
