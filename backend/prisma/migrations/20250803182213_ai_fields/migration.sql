-- AlterTable
ALTER TABLE "public"."drugs" ADD COLUMN     "ai_contraindications" TEXT,
ADD COLUMN     "ai_dosing" TEXT,
ADD COLUMN     "ai_use_and_conditions" TEXT,
ADD COLUMN     "ai_warnings" TEXT;
