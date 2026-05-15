-- CreateTable
CREATE TABLE "Pattern" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrillHole" (
    "id" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "z" DOUBLE PRECISION NOT NULL,
    "depth" DOUBLE PRECISION NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "DrillHole_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DrillHole" ADD CONSTRAINT "DrillHole_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
