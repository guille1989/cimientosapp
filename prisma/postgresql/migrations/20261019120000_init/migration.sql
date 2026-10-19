-- CreateEnum
CREATE TYPE "Role" AS ENUM ('INVESTOR', 'PROMOTER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('PENDING', 'APPROVED', 'REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ANALYSIS', 'INFO_REQUIRED', 'APPROVED', 'PUBLISHED', 'FUNDING', 'FUNDED', 'IN_PROGRESS', 'REPAID', 'DELAYED', 'RECOVERY', 'CANCELLED', 'COMING_SOON');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('DEBT', 'EQUITY', 'RENTAL');

-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('REFLECTION', 'CONFIRMED', 'INVESTED', 'CANCELLED', 'REFUNDED', 'REPAID');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PLANNED', 'VALIDATION_REQUESTED', 'APPROVED', 'DISBURSED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('COMMITMENT', 'CANCELLATION', 'REFUND', 'DISTRIBUTION', 'CAPITAL_RETURN', 'ADJUSTMENT', 'DISBURSEMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'PENDING',
    "notificationPreferences" TEXT NOT NULL DEFAULT '{"newProjects":true,"updates":true,"delays":true,"distributions":true,"incidents":true,"documents":true}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fiscalCountry" TEXT NOT NULL DEFAULT 'España',
    "bankAccount" TEXT NOT NULL DEFAULT 'DEMO ES00 0000 0000 0000 0000 0000',
    "values" TEXT NOT NULL DEFAULT '{}',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "InvestorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "PromoterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuitabilityAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "score" INTEGER NOT NULL DEFAULT 0,
    "suitable" BOOLEAN NOT NULL DEFAULT false,
    "riskAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SuitabilityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT 'Ubicación ficticia',
    "promoterId" TEXT NOT NULL,
    "type" "ProjectType" NOT NULL DEFAULT 'DEBT',
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "fundedCents" INTEGER NOT NULL DEFAULT 0,
    "investorCount" INTEGER NOT NULL DEFAULT 0,
    "minInvestmentCents" INTEGER NOT NULL DEFAULT 10000,
    "duration" INTEGER NOT NULL DEFAULT 18,
    "annualRate" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "ltv" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "risk" TEXT NOT NULL DEFAULT 'C',
    "mortgage" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT NOT NULL DEFAULT '/assets/cimiento-hero.png',
    "description" TEXT NOT NULL DEFAULT '',
    "useOfFunds" TEXT NOT NULL DEFAULT '',
    "guarantees" TEXT NOT NULL DEFAULT '',
    "exitStrategy" TEXT NOT NULL DEFAULT '',
    "experience" INTEGER NOT NULL DEFAULT 0,
    "licenses" TEXT NOT NULL DEFAULT 'Pendiente de revisión',
    "land" TEXT NOT NULL DEFAULT '',
    "planning" TEXT NOT NULL DEFAULT '',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fundingDeadline" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "risks" TEXT NOT NULL DEFAULT 'Riesgo de pérdida total o parcial, retraso, impago y falta de liquidez.',
    "reviewMessage" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFinancials" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "targetCents" INTEGER NOT NULL,
    "budgetCents" INTEGER NOT NULL,
    "ownCapitalCents" INTEGER NOT NULL DEFAULT 0,
    "bankFinancingCents" INTEGER NOT NULL DEFAULT 0,
    "contingencyCents" INTEGER NOT NULL DEFAULT 0,
    "presales" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectFinancials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRiskAssessment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "factors" TEXT NOT NULL,
    "decision" TEXT NOT NULL DEFAULT 'PENDING',
    "justification" TEXT NOT NULL DEFAULT '',
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectRiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expectedDate" TIMESTAMP(3) NOT NULL,
    "actualDate" TIMESTAMP(3),
    "amountCents" INTEGER NOT NULL,
    "evidence" TEXT,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PLANNED',
    "certified" BOOLEAN NOT NULL DEFAULT false,
    "approved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectUpdate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentCommitment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "CommitmentStatus" NOT NULL DEFAULT 'REFLECTION',
    "acceptances" TEXT NOT NULL,
    "reflectionEndsAt" TIMESTAMP(3) NOT NULL,
    "capitalReturnedCents" INTEGER NOT NULL DEFAULT 0,
    "interestReceivedCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "capitalCents" INTEGER NOT NULL,
    "interestCents" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" TEXT NOT NULL DEFAULT '{}',
    "after" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorProfile_userId_key" ON "InvestorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoterProfile_userId_key" ON "PromoterProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SuitabilityAssessment_userId_key" ON "SuitabilityAssessment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFinancials_projectId_key" ON "ProjectFinancials"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRiskAssessment_projectId_key" ON "ProjectRiskAssessment"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMilestone_projectId_idx" ON "ProjectMilestone"("projectId");

-- CreateIndex
CREATE INDEX "InvestmentCommitment_userId_idx" ON "InvestmentCommitment"("userId");

-- CreateIndex
CREATE INDEX "InvestmentCommitment_projectId_status_idx" ON "InvestmentCommitment"("projectId", "status");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorProfile" ADD CONSTRAINT "InvestorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoterProfile" ADD CONSTRAINT "PromoterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuitabilityAssessment" ADD CONSTRAINT "SuitabilityAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFinancials" ADD CONSTRAINT "ProjectFinancials_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRiskAssessment" ADD CONSTRAINT "ProjectRiskAssessment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentCommitment" ADD CONSTRAINT "InvestmentCommitment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentCommitment" ADD CONSTRAINT "InvestmentCommitment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
