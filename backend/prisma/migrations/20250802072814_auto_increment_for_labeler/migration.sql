/*
  Warnings:

  - The primary key for the `labelers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `labelers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `labeler_id` on the `drugs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."drugs" DROP CONSTRAINT "drugs_labeler_id_fkey";

-- AlterTable
ALTER TABLE "public"."drugs" DROP COLUMN "labeler_id",
ADD COLUMN     "labeler_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."labelers" DROP CONSTRAINT "labelers_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "labelers_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "public"."drugs" ADD CONSTRAINT "drugs_labeler_id_fkey" FOREIGN KEY ("labeler_id") REFERENCES "public"."labelers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
