-- CreateTable
CREATE TABLE "KeepReading" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeepReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KeepReading_userId_idx" ON "KeepReading"("userId");

-- CreateIndex
CREATE INDEX "KeepReading_mangaId_idx" ON "KeepReading"("mangaId");

-- CreateIndex
CREATE UNIQUE INDEX "KeepReading_userId_mangaId_key" ON "KeepReading"("userId", "mangaId");

-- AddForeignKey
ALTER TABLE "KeepReading" ADD CONSTRAINT "KeepReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeepReading" ADD CONSTRAINT "KeepReading_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeepReading" ADD CONSTRAINT "KeepReading_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
