-- AlterTable
ALTER TABLE "SkuRow" ADD COLUMN "givenForWhiteBgShoot" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SkuRow" ADD COLUMN "givenForModelShoot" INTEGER NOT NULL DEFAULT 0;

UPDATE "SkuRow" SET "givenForWhiteBgShoot" = "givenToPhotoshoot" WHERE "givenToPhotoshoot" > 0;

ALTER TABLE "SkuRow" DROP COLUMN "givenToPhotoshoot";
