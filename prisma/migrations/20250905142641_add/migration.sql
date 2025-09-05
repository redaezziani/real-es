-- AlterEnum
ALTER TYPE "public"."ScraperPlatform" ADD VALUE 'LEKMANGA';

-- CreateTable
CREATE TABLE "public"."Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LikedManga" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LikedManga_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bookmark_userId_idx" ON "public"."Bookmark"("userId");

-- CreateIndex
CREATE INDEX "Bookmark_mangaId_idx" ON "public"."Bookmark"("mangaId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_mangaId_key" ON "public"."Bookmark"("userId", "mangaId");

-- CreateIndex
CREATE INDEX "LikedManga_userId_idx" ON "public"."LikedManga"("userId");

-- CreateIndex
CREATE INDEX "LikedManga_mangaId_idx" ON "public"."LikedManga"("mangaId");

-- CreateIndex
CREATE UNIQUE INDEX "LikedManga_userId_mangaId_key" ON "public"."LikedManga"("userId", "mangaId");

-- AddForeignKey
ALTER TABLE "public"."Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bookmark" ADD CONSTRAINT "Bookmark_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "public"."Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LikedManga" ADD CONSTRAINT "LikedManga_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LikedManga" ADD CONSTRAINT "LikedManga_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "public"."Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;
