-- AlterTable
ALTER TABLE "InvestmentCommitment" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentCommitment_userId_idempotencyKey_key" ON "InvestmentCommitment"("userId", "idempotencyKey");
