/*
  Warnings:

  - You are about to drop the column `view_blocks` on the `drugs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."drugs" DROP COLUMN "view_blocks",
ADD COLUMN     "contra_indications_blocks" JSONB,
ADD COLUMN     "description_blocks" JSONB,
ADD COLUMN     "dosing_blocks" JSONB,
ADD COLUMN     "meta_description_blocks" JSONB,
ADD COLUMN     "use_and_conditions_blocks" JSONB,
ADD COLUMN     "warning_blocks" JSONB;
