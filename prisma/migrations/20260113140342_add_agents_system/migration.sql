-- CreateEnum
CREATE TYPE "EmotionalState" AS ENUM ('CURIOSITY', 'THREAT', 'FASCINATION', 'CONFRONTATION', 'DARK_INSPIRATION');

-- CreateEnum
CREATE TYPE "RevelationDynamic" AS ENUM ('PROGRESSIVE', 'HIDDEN', 'EARLY', 'FRAGMENTS');

-- CreateEnum
CREATE TYPE "NarrativePressure" AS ENUM ('SLOW', 'FLUID', 'FAST');

-- CreateEnum
CREATE TYPE "HookType" AS ENUM ('QUESTION', 'SHOCK', 'CHALLENGE', 'MYSTERY', 'STATEMENT');

-- CreateEnum
CREATE TYPE "ClosingType" AS ENUM ('CTA_DIRECT', 'REVELATION', 'QUESTION', 'CHALLENGE', 'LOOP');

-- CreateEnum
CREATE TYPE "ShortStatus" AS ENUM ('DRAFT', 'GENERATING_SCRIPT', 'SCRIPT_READY', 'SCRIPT_APPROVED', 'GENERATING_IMAGES', 'IMAGES_READY', 'GENERATING_VIDEO', 'VIDEO_READY', 'PUBLISHED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SceneMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('CLIMATE', 'STYLE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SystemAgentType" AS ENUM ('SCRIPTWRITER', 'PROMPT_ENGINEER', 'NARRATOR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OperationType" ADD VALUE 'FAL_IMAGE_GENERATION';
ALTER TYPE "OperationType" ADD VALUE 'FAL_VIDEO_GENERATION';
ALTER TYPE "OperationType" ADD VALUE 'SHORT_GENERATION';
ALTER TYPE "OperationType" ADD VALUE 'SCRIPT_GENERATION';
ALTER TYPE "OperationType" ADD VALUE 'SCRIPT_REGENERATION';
ALTER TYPE "OperationType" ADD VALUE 'SCENE_REGENERATION';

-- AlterTable
ALTER TABLE "AdminSettings" ADD COLUMN     "defaultModels" JSONB;

-- CreateTable
CREATE TABLE "Short" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "title" TEXT,
    "theme" TEXT NOT NULL,
    "targetDuration" INTEGER NOT NULL DEFAULT 30,
    "style" TEXT NOT NULL DEFAULT 'engaging',
    "script" JSONB,
    "hook" TEXT,
    "cta" TEXT,
    "status" "ShortStatus" NOT NULL DEFAULT 'DRAFT',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "aiModel" TEXT DEFAULT 'deepseek/deepseek-v3.2',
    "scriptApprovedAt" TIMESTAMP(3),
    "scriptVersion" INTEGER NOT NULL DEFAULT 1,
    "summary" TEXT,
    "synopsis" TEXT,
    "styleId" TEXT,
    "fullNarration" TEXT,
    "premise" TEXT,
    "story" TEXT,
    "toneId" TEXT,
    "climateId" TEXT,

    CONSTRAINT "Short_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortScene" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "narration" TEXT,
    "visualDesc" TEXT,
    "imagePrompt" TEXT,
    "negativePrompt" TEXT,
    "mediaType" "SceneMediaType" NOT NULL DEFAULT 'IMAGE',
    "mediaUrl" TEXT,
    "mediaWidth" INTEGER,
    "mediaHeight" INTEGER,
    "isGenerated" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "visualPrompt" TEXT,

    CONSTRAINT "ShortScene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalAgent" (
    "id" TEXT NOT NULL,
    "type" "SystemAgentType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'anthropic/claude-3.5-sonnet',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAgent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "type" "SystemAgentType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "model" TEXT,
    "temperature" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "type" "AgentType" NOT NULL,
    "systemMessage" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "outputFields" JSONB NOT NULL,
    "validationRules" JSONB,
    "model" TEXT NOT NULL DEFAULT 'deepseek/deepseek-chat',
    "creditsPerUse" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalStyle" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "scriptwriterPrompt" TEXT,
    "promptEngineerPrompt" TEXT,
    "visualStyle" TEXT,
    "negativePrompt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStyle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "scriptwriterPrompt" TEXT,
    "promptEngineerPrompt" TEXT,
    "visualStyle" TEXT,
    "negativePrompt" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "traits" JSONB,
    "promptDescription" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortCharacter" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'character',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "customPrompt" TEXT,
    "customClothing" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Style" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT DEFAULT '🎬',
    "contentType" TEXT NOT NULL DEFAULT 'story',
    "scriptwriterPrompt" TEXT,
    "narrativeStyle" TEXT,
    "languageStyle" TEXT,
    "exampleHook" TEXT,
    "exampleCta" TEXT,
    "visualPrompt" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "keywords" TEXT[],
    "suggestedClimateId" TEXT,
    "targetAudience" TEXT,

    CONSTRAINT "Style_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Climate" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "emotionalState" "EmotionalState" NOT NULL DEFAULT 'CURIOSITY',
    "revelationDynamic" "RevelationDynamic" NOT NULL DEFAULT 'PROGRESSIVE',
    "narrativePressure" "NarrativePressure" NOT NULL DEFAULT 'FLUID',
    "hookType" "HookType" NOT NULL DEFAULT 'QUESTION',
    "closingType" "ClosingType" NOT NULL DEFAULT 'CTA_DIRECT',
    "allowedRevelations" JSONB,
    "allowedPressures" JSONB,
    "sentenceMaxWords" INTEGER NOT NULL DEFAULT 15,
    "minScenes" INTEGER NOT NULL DEFAULT 3,
    "maxScenes" INTEGER NOT NULL DEFAULT 15,
    "promptFragment" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Climate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Short_userId_idx" ON "Short"("userId");

-- CreateIndex
CREATE INDEX "Short_clerkUserId_idx" ON "Short"("clerkUserId");

-- CreateIndex
CREATE INDEX "Short_status_idx" ON "Short"("status");

-- CreateIndex
CREATE INDEX "Short_createdAt_idx" ON "Short"("createdAt");

-- CreateIndex
CREATE INDEX "ShortScene_shortId_idx" ON "ShortScene"("shortId");

-- CreateIndex
CREATE INDEX "ShortScene_order_idx" ON "ShortScene"("order");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalAgent_type_key" ON "GlobalAgent"("type");

-- CreateIndex
CREATE INDEX "GlobalAgent_type_idx" ON "GlobalAgent"("type");

-- CreateIndex
CREATE INDEX "GlobalAgent_isActive_idx" ON "GlobalAgent"("isActive");

-- CreateIndex
CREATE INDEX "UserAgent_userId_idx" ON "UserAgent"("userId");

-- CreateIndex
CREATE INDEX "UserAgent_clerkUserId_idx" ON "UserAgent"("clerkUserId");

-- CreateIndex
CREATE INDEX "UserAgent_type_idx" ON "UserAgent"("type");

-- CreateIndex
CREATE UNIQUE INDEX "UserAgent_userId_type_key" ON "UserAgent"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_slug_key" ON "Agent"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalStyle_key_key" ON "GlobalStyle"("key");

-- CreateIndex
CREATE INDEX "GlobalStyle_key_idx" ON "GlobalStyle"("key");

-- CreateIndex
CREATE INDEX "GlobalStyle_isActive_idx" ON "GlobalStyle"("isActive");

-- CreateIndex
CREATE INDEX "GlobalStyle_sortOrder_idx" ON "GlobalStyle"("sortOrder");

-- CreateIndex
CREATE INDEX "UserStyle_userId_idx" ON "UserStyle"("userId");

-- CreateIndex
CREATE INDEX "UserStyle_clerkUserId_idx" ON "UserStyle"("clerkUserId");

-- CreateIndex
CREATE INDEX "UserStyle_key_idx" ON "UserStyle"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UserStyle_userId_key_key" ON "UserStyle"("userId", "key");

-- CreateIndex
CREATE INDEX "Character_userId_idx" ON "Character"("userId");

-- CreateIndex
CREATE INDEX "Character_clerkUserId_idx" ON "Character"("clerkUserId");

-- CreateIndex
CREATE INDEX "Character_isActive_idx" ON "Character"("isActive");

-- CreateIndex
CREATE INDEX "Character_usageCount_idx" ON "Character"("usageCount");

-- CreateIndex
CREATE INDEX "ShortCharacter_shortId_idx" ON "ShortCharacter"("shortId");

-- CreateIndex
CREATE INDEX "ShortCharacter_characterId_idx" ON "ShortCharacter"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "ShortCharacter_shortId_characterId_key" ON "ShortCharacter"("shortId", "characterId");

-- CreateIndex
CREATE INDEX "Style_userId_idx" ON "Style"("userId");

-- CreateIndex
CREATE INDEX "Climate_userId_idx" ON "Climate"("userId");

-- CreateIndex
CREATE INDEX "Climate_isSystem_idx" ON "Climate"("isSystem");

-- AddForeignKey
ALTER TABLE "Short" ADD CONSTRAINT "Short_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Short" ADD CONSTRAINT "Short_climateId_fkey" FOREIGN KEY ("climateId") REFERENCES "Climate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Short" ADD CONSTRAINT "Short_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortScene" ADD CONSTRAINT "ShortScene_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "Short"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAgent" ADD CONSTRAINT "UserAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStyle" ADD CONSTRAINT "UserStyle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortCharacter" ADD CONSTRAINT "ShortCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortCharacter" ADD CONSTRAINT "ShortCharacter_shortId_fkey" FOREIGN KEY ("shortId") REFERENCES "Short"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_suggestedClimateId_fkey" FOREIGN KEY ("suggestedClimateId") REFERENCES "Climate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Climate" ADD CONSTRAINT "Climate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
