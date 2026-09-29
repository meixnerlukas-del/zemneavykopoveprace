-- AlterTable
ALTER TABLE "Order" ADD COLUMN "overrideTotalWithVat" DECIMAL(65,30);
ALTER TABLE "Order" ADD COLUMN "priceNote" TEXT;
