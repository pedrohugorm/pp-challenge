import Link from 'next/link';
import { fetchMedicationBySlug } from '@/services/medicationService';
import { notFound } from 'next/navigation';
import {renderBlocks} from "@/utils/renderBlocks";

interface MedicationPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function MedicationPage({ params }: MedicationPageProps) {
    try {
        const resolvedParams = await params;
        const medication = await fetchMedicationBySlug(resolvedParams.slug);

        // Additional check to ensure medication is not null
        if (!medication) {
            console.error('Medication is null or undefined');
            notFound();
        }
        
        return (
            <div className="min-h-screen bg-gray-50 medication-document">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Link 
                            href="/"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Medications
                        </Link>
                    </div>

                    <h1>{medication.name}</h1>

                    {renderBlocks(medication.blocks_json['labeler'], 1)}

                    {/* {renderBlocks(medication.blocks_json['description'], 1)} */}
                    {renderBlocks(medication.blocks_json['indicationsAndUsage'], 1)}
                    {renderBlocks(medication.blocks_json['dosageAndAdministration'], 1)}
                    {renderBlocks(medication.blocks_json['contraindications'], 1)}
                    {renderBlocks(medication.blocks_json['warningsAndPrecautions'], 1)}

                    {renderBlocks(medication.blocks_json['boxedWarning'], 1)}

                    {/* {renderBlocks(medication.blocks_json['dosageFormsAndStrengths'], 1)} */}
                    {/* {renderBlocks(medication.blocks_json['adverseReactions'], 1)} */}
                    {/* {renderBlocks(medication.blocks_json['clinicalPharmacology'], 1)} */}
                    {/* {renderBlocks(medication.blocks_json['clinicalStudies'], 1)} */}
                    {/* {renderBlocks(medication.blocks_json['howSupplied'], 1)} */}
                    {/* {renderBlocks(medication.blocks_json['useInSpecificPopulations'], 1)} */}
                    {/* {renderBlocks(medication.blocks_json['nonclinicalToxicology'], 1)} */}
                    {/* {renderBlocks(medication.blocks_json['instructionsForUse'], 1)} */}
                    {/* {renderBlocks(medication.blocks_json['mechanismOfAction'], 1)} */}
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error loading medication:', error);
        notFound();
    }
} 