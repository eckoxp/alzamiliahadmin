-- AlterTable
ALTER TABLE "apartments" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "sheet_last_summary" TEXT,
ADD COLUMN     "sheet_last_synced_at" TIMESTAMP(3),
ADD COLUMN     "sheet_sync_error" TEXT,
ADD COLUMN     "sheet_sync_status" TEXT DEFAULT 'idle',
ADD COLUMN     "sheet_tab_name" TEXT,
ADD COLUMN     "sheet_url" TEXT,
ADD COLUMN     "sheet_webhook_secret" TEXT;
