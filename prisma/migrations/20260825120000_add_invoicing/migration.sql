-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invoiceNumber" TEXT NOT NULL,
    "variableSymbol" TEXT NOT NULL,
    "amountWithoutVat" DECIMAL(65,30) NOT NULL,
    "amountWithVat" DECIMAL(65,30) NOT NULL,
    "vatRate" INTEGER NOT NULL DEFAULT 20,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "uctoplusInvoiceId" TEXT,
    "uctoplusNumber" TEXT,
    "relatedProformaId" TEXT,
    "pdfUrl" TEXT,
    "lastError" TEXT,
    "issuedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
