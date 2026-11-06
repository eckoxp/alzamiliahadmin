-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "type" TEXT,
    "description_ar" TEXT,
    "description_en" TEXT,
    "excerpt_ar" TEXT,
    "excerpt_en" TEXT,
    "image" TEXT,
    "image2" TEXT,
    "image3" TEXT,
    "image4" TEXT,
    "image5" TEXT,
    "image6" TEXT,
    "buildings_count" INTEGER,
    "units_count" INTEGER,
    "elevators_count" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "location_ar" TEXT,
    "location_en" TEXT,
    "address" TEXT,
    "link_location" TEXT,
    "link_project" TEXT,
    "link_map" TEXT,
    "video_link" TEXT,
    "live_preview" TEXT,
    "city" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "status" INTEGER NOT NULL DEFAULT 1,
    "status_apartment" INTEGER NOT NULL DEFAULT 1,
    "availability" INTEGER NOT NULL DEFAULT 1,
    "is_featured" INTEGER NOT NULL DEFAULT 0,
    "elec" INTEGER NOT NULL DEFAULT 0,
    "devices" INTEGER NOT NULL DEFAULT 0,
    "elevator" INTEGER NOT NULL DEFAULT 0,
    "air" INTEGER NOT NULL DEFAULT 0,
    "plumber" INTEGER NOT NULL DEFAULT 0,
    "house" INTEGER NOT NULL DEFAULT 0,
    "high_quality" INTEGER NOT NULL DEFAULT 0,
    "smart_entry" INTEGER NOT NULL DEFAULT 0,
    "fire_sensor" INTEGER NOT NULL DEFAULT 0,
    "icon_3d" TEXT,
    "icon_follow" TEXT,
    "build_year" TEXT,
    "sq_fit" TEXT,
    "project_file" TEXT,
    "project_file2" TEXT,
    "project_file3" TEXT,
    "video" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartments" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "building_name" TEXT,
    "floor" INTEGER,
    "area" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "price" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'available',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apartments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_requests" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "project_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" SERIAL NOT NULL,
    "ip" TEXT,
    "country" TEXT,
    "city" TEXT,
    "user_agent" TEXT,
    "page" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
