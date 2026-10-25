-- AlterTable: one-piece shoot workflow
ALTER TABLE "SkuRow" ADD COLUMN "whiteBgWithPhotoshoot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SkuRow" ADD COLUMN "whiteBgPieceReturned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SkuRow" ADD COLUMN "modelWithPhotoshoot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SkuRow" ADD COLUMN "modelPieceReturned" BOOLEAN NOT NULL DEFAULT false;

UPDATE "SkuRow" SET "whiteBgWithPhotoshoot" = ("givenForWhiteBgShoot" > 0);
UPDATE "SkuRow" SET "modelWithPhotoshoot" = ("givenForModelShoot" > 0);

ALTER TABLE "SkuRow" DROP COLUMN "givenForWhiteBgShoot";
ALTER TABLE "SkuRow" DROP COLUMN "givenForModelShoot";
