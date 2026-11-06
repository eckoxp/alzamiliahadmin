-- CreateTable
CREATE TABLE "page_views" (
    "id" SERIAL NOT NULL,
    "visitor_key" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "project_id" INTEGER,
    "view_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_views_view_date_path_idx" ON "page_views"("view_date", "path");

-- CreateIndex
CREATE INDEX "page_views_project_id_idx" ON "page_views"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "page_views_visitor_key_path_view_date_key" ON "page_views"("visitor_key", "path", "view_date");
