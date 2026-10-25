-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SkuRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SkuRow_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SkuRow_collectionId_idx" ON "SkuRow"("collectionId");
