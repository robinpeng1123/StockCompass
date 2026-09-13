-- CreateTable
CREATE TABLE "NewsSignal" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsSignal_ticker_idx" ON "NewsSignal"("ticker");
