/*
  Warnings:

  - You are about to drop the `progress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "progress" DROP CONSTRAINT "progress_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "progress" DROP CONSTRAINT "progress_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "progress" DROP CONSTRAINT "progress_userId_fkey";

-- DropTable
DROP TABLE "progress";

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EnrollmentToProgress" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EnrollmentToProgress_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Progress_userId_idx" ON "Progress"("userId");

-- CreateIndex
CREATE INDEX "Progress_lessonId_idx" ON "Progress"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_userId_lessonId_key" ON "Progress"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "_EnrollmentToProgress_B_index" ON "_EnrollmentToProgress"("B");

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EnrollmentToProgress" ADD CONSTRAINT "_EnrollmentToProgress_A_fkey" FOREIGN KEY ("A") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EnrollmentToProgress" ADD CONSTRAINT "_EnrollmentToProgress_B_fkey" FOREIGN KEY ("B") REFERENCES "Progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
