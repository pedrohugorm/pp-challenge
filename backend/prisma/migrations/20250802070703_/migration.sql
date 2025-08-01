/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `labelers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "labelers_name_key" ON "public"."labelers"("name");
