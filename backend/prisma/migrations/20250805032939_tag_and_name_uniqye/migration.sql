/*
  Warnings:

  - A unique constraint covering the columns `[name,category]` on the table `tags` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."tags_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_category_key" ON "public"."tags"("name", "category");
