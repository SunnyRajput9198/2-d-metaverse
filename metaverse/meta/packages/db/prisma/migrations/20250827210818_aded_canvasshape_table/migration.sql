/*
  Warnings:

  - You are about to drop the column `meta` on the `spaceElements` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "spaceElements" DROP COLUMN "meta";

-- CreateTable
CREATE TABLE "CanvasShape" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "shapeData" JSONB NOT NULL,

    CONSTRAINT "CanvasShape_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CanvasShape_spaceId_idx" ON "CanvasShape"("spaceId");

-- AddForeignKey
ALTER TABLE "CanvasShape" ADD CONSTRAINT "CanvasShape_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
