-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('VIEW', 'BOOKMARK', 'LIKE', 'COMPLETE', 'DROPPED');

-- CreateTable
CREATE TABLE "MangaInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MangaInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MangaSimilarity" (
    "id" TEXT NOT NULL,
    "sourceMangaId" TEXT NOT NULL,
    "targetMangaId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MangaSimilarity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MangaInteraction_userId_type_idx" ON "MangaInteraction"("userId", "type");

-- CreateIndex
CREATE INDEX "MangaInteraction_mangaId_type_idx" ON "MangaInteraction"("mangaId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "MangaInteraction_userId_mangaId_type_key" ON "MangaInteraction"("userId", "mangaId", "type");

-- CreateIndex
CREATE INDEX "MangaSimilarity_sourceMangaId_score_idx" ON "MangaSimilarity"("sourceMangaId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "MangaSimilarity_sourceMangaId_targetMangaId_key" ON "MangaSimilarity"("sourceMangaId", "targetMangaId");

-- AddForeignKey
ALTER TABLE "MangaInteraction" ADD CONSTRAINT "MangaInteraction_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MangaInteraction" ADD CONSTRAINT "MangaInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MangaSimilarity" ADD CONSTRAINT "MangaSimilarity_sourceMangaId_fkey" FOREIGN KEY ("sourceMangaId") REFERENCES "Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MangaSimilarity" ADD CONSTRAINT "MangaSimilarity_targetMangaId_fkey" FOREIGN KEY ("targetMangaId") REFERENCES "Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;
