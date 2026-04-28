-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'DATE_RANGE',
    "availableDates" TIMESTAMP(3)[],
    "timeWindows" JSONB,
    "desiredDuration" INTEGER,
    "creatorId" TEXT NOT NULL,
    "creatorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "selectedDates" TIMESTAMP(3)[],
    "comment" TEXT,
    "selectedTimeWindows" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortLink" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "clickCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkClick" (
    "id" TEXT NOT NULL,
    "shortLinkId" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "LinkClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureSuggestion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tool" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submitterId" TEXT NOT NULL,
    "submitterName" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalityQuiz" (
    "id" TEXT NOT NULL,
    "ownerToken" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "selectionCount" INTEGER NOT NULL,
    "creatorId" TEXT NOT NULL,
    "creatorName" TEXT,
    "selfWords" TEXT[],
    "wordPool" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalityQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalityResponse" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "responseToken" TEXT NOT NULL,
    "selectedWords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalityResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE INDEX "Plan_creatorId_idx" ON "Plan"("creatorId");

-- CreateIndex
CREATE INDEX "Response_planId_idx" ON "Response"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_key_idx" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_creatorId_idx" ON "ApiKey"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_slug_key" ON "ShortLink"("slug");

-- CreateIndex
CREATE INDEX "ShortLink_creatorId_idx" ON "ShortLink"("creatorId");

-- CreateIndex
CREATE INDEX "ShortLink_expiresAt_idx" ON "ShortLink"("expiresAt");

-- CreateIndex
CREATE INDEX "LinkClick_shortLinkId_idx" ON "LinkClick"("shortLinkId");

-- CreateIndex
CREATE INDEX "LinkClick_clickedAt_idx" ON "LinkClick"("clickedAt");

-- CreateIndex
CREATE INDEX "FeatureSuggestion_submitterId_idx" ON "FeatureSuggestion"("submitterId");

-- CreateIndex
CREATE INDEX "FeatureSuggestion_status_idx" ON "FeatureSuggestion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalityQuiz_ownerToken_key" ON "PersonalityQuiz"("ownerToken");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalityQuiz_shareToken_key" ON "PersonalityQuiz"("shareToken");

-- CreateIndex
CREATE INDEX "PersonalityQuiz_creatorId_idx" ON "PersonalityQuiz"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalityResponse_responseToken_key" ON "PersonalityResponse"("responseToken");

-- CreateIndex
CREATE INDEX "PersonalityResponse_quizId_idx" ON "PersonalityResponse"("quizId");

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkClick" ADD CONSTRAINT "LinkClick_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalityResponse" ADD CONSTRAINT "PersonalityResponse_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "PersonalityQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
