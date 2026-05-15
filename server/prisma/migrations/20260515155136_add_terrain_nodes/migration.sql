-- CreateTable
CREATE TABLE "TerrainNode" (
    "id" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "gridX" INTEGER NOT NULL,
    "gridZ" INTEGER NOT NULL,
    "elevation" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "TerrainNode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TerrainNode_patternId_gridX_gridZ_key" ON "TerrainNode"("patternId", "gridX", "gridZ");

-- AddForeignKey
ALTER TABLE "TerrainNode" ADD CONSTRAINT "TerrainNode_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
