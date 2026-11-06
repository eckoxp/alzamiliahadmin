/*
  Warnings:

  - A unique constraint covering the columns `[sheet_webhook_secret]` on the table `projects` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "projects_sheet_webhook_secret_key" ON "projects"("sheet_webhook_secret");
