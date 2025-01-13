-- CreateEnum
CREATE TYPE "ScraperPlatform" AS ENUM ('ASHEQ', 'MANGAPLUS', 'MANGADEX');

-- AlterTable
ALTER TABLE "Manga" ADD COLUMN     "platform" "ScraperPlatform" NOT NULL DEFAULT 'ASHEQ';
