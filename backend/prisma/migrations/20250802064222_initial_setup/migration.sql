-- CreateTable
CREATE TABLE "public"."labelers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labelers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."drugs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "generic_name" TEXT,
    "product_type" TEXT,
    "effective_time" TIMESTAMP(3),
    "title" TEXT,
    "slug" TEXT NOT NULL,
    "labeler_id" TEXT NOT NULL,
    "indications_and_usage" TEXT,
    "dosage_and_administration" TEXT,
    "dosage_forms_and_strengths" TEXT,
    "warnings_and_precautions" TEXT,
    "adverse_reactions" TEXT,
    "clinical_pharmacology" TEXT,
    "clinical_studies" TEXT,
    "how_supplied" TEXT,
    "use_in_specific_populations" TEXT,
    "description" TEXT,
    "nonclinical_toxicology" TEXT,
    "instructions_for_use" TEXT,
    "mechanism_of_action" TEXT,
    "contraindications" TEXT,
    "boxed_warning" TEXT,
    "highlights" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drugs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drugs_slug_key" ON "public"."drugs"("slug");

-- AddForeignKey
ALTER TABLE "public"."drugs" ADD CONSTRAINT "drugs_labeler_id_fkey" FOREIGN KEY ("labeler_id") REFERENCES "public"."labelers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
