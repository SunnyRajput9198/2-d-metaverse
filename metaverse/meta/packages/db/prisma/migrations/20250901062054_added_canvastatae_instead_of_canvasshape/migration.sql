/*
  Warnings:

  - You are about to drop the `CanvasShape` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CanvasShape" DROP CONSTRAINT "CanvasShape_spaceId_fkey";

-- DropTable
DROP TABLE "CanvasShape";

-- CreateTable
CREATE TABLE "CanvasState" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "elements" JSONB NOT NULL,

    CONSTRAINT "CanvasState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CanvasState_spaceId_key" ON "CanvasState"("spaceId");

-- AddForeignKey
ALTER TABLE "CanvasState" ADD CONSTRAINT "CanvasState_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
