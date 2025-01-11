/*
  Warnings:

  - You are about to drop the `Properties` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PropertiesImages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Properties" DROP CONSTRAINT "Properties_profileId_fkey";

-- DropForeignKey
ALTER TABLE "PropertiesImages" DROP CONSTRAINT "PropertiesImages_propertyId_fkey";

-- DropTable
DROP TABLE "Properties";

-- DropTable
DROP TABLE "PropertiesImages";

-- DropEnum
DROP TYPE "currency";

-- DropEnum
DROP TYPE "propertyType";

-- DropEnum
DROP TYPE "status";

-- CreateTable
CREATE TABLE "Manga" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "otherTitles" TEXT[],
    "description" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "authors" TEXT[],
    "artists" TEXT[],
    "type" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "genres" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manga_pkey" PRIMARY KEY ("id")
);
