-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkuRow" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "samplesReceived" INTEGER NOT NULL DEFAULT 0,
    "givenToPhotoshoot" INTEGER NOT NULL DEFAULT 0,
    "factoryStock" INTEGER NOT NULL DEFAULT 0,
    "hasWhiteBgImages" BOOLEAN NOT NULL DEFAULT false,
    "whiteBgImageUrl" TEXT,
    "hasModelImages" BOOLEAN NOT NULL DEFAULT false,
    "modelImageUrl" TEXT,
    "isLiveOnWebsite" BOOLEAN NOT NULL DEFAULT false,
    "notLiveReason" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkuRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkuRow_collectionId_idx" ON "SkuRow"("collectionId");

-- AddForeignKey
ALTER TABLE "SkuRow" ADD CONSTRAINT "SkuRow_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
