-- CreateTable
CREATE TABLE "project_images" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "project_images" ADD CONSTRAINT "project_images_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
