-- AlterTable
ALTER TABLE "Partner" ADD COLUMN "loginEmail" TEXT;

-- CreateTable
CREATE TABLE "PartnerLoginToken" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerLoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerSession" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_loginEmail_key" ON "Partner"("loginEmail");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerLoginToken_tokenHash_key" ON "PartnerLoginToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerSession_tokenHash_key" ON "PartnerSession"("tokenHash");

-- AddForeignKey
ALTER TABLE "PartnerLoginToken" ADD CONSTRAINT "PartnerLoginToken_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerSession" ADD CONSTRAINT "PartnerSession_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
