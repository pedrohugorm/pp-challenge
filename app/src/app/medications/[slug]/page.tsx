import Link from 'next/link';
import {fetchMedicationBySlug} from '@/services/medicationService';
import {notFound} from 'next/navigation';
import MedicationHeader from '@/components/MedicationHeader';
import MedicationAssistant from '@/components/MedicationAssistant';
import SimilarMedicationsList from "@/components/SimilarMedicationsList";
import {RenderBlocks, renderBlocks} from "@/utils/renderBlocks";
import { Metadata } from 'next';

interface MedicationPageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Shared function to get medication data
async function getMedicationData(slug: string) {
    try {
        const medication = await fetchMedicationBySlug(slug);
        if (!medication) {
            return null;
        }
        return medication;
    } catch (error) {
        console.error('Error fetching medication:', error);
        return null;
    }
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const medication = await getMedicationData(resolvedParams.slug);

    if (!medication) {
        return {
            title: 'Medication Not Found',
            description: 'The requested medication could not be found.'
        };
    }

    const title = `${medication.name} - ${medication.labeler.name}`;
    const description = medication.meta_description;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Drug",
        "name": medication.name,
        "alternateName": medication.generic_name,
        "manufacturer": {
            "@type": "Organization",
            "name": medication.labeler.name,
        },
        "description": medication.meta_description,
        // "image": medication.image,
    };

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            // url: pageUrl,
            // images: medication.image ? [{ url: medication.image }] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            // images: medication.image ? [medication.image] : undefined,
        },
        other: {
            'application/ld+json': JSON.stringify(jsonLd),
        },
    };
}

export default async function MedicationPage({params}: MedicationPageProps) {
    const resolvedParams = await params;
    const medication = await getMedicationData(resolvedParams.slug);

    // Additional check to ensure medication is not null
    if (!medication) {
        console.error('Medication is null or undefined');
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex h-screen">
                {/* Main Content - Medication Details */}
                <div className="flex-1 flex flex-col">
                    <MedicationHeader title="Medication Search"/>

                    <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
                        <div className="max-w-4xl mx-auto medication-document">
                            {/* Back Button */}
                            <div className="mb-6">
                                <Link
                                    href="/"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M15 19l-7-7 7-7"/>
                                    </svg>
                                    Back to Medications
                                </Link>
                            </div>

                            <div className="main-content">
                                <h1>{medication.name}</h1>
                                <p>Labeler: {medication.labeler.name}</p>
                                <p>Generic name: {medication.generic_name}</p>
                                <p>Product type: {medication.product_type}</p>
                                <p>Effective date: {new Date(medication.effective_time).toLocaleDateString()}</p>

                                <div className="medication-section">{medication.labeler.name}</div>

                                <h2>Description</h2>
                                <div className="medication-section">
                                    <RenderBlocks blocks={medication.meta_description_blocks} headerOffset={0} />
                                </div>
                                <h2>Use and Conditions</h2>
                                <div className="medication-section">
                                    <RenderBlocks blocks={medication.use_and_conditions_blocks} headerOffset={0} />
                                </div>
                                <h2>Dosing and Administration</h2>
                                <div className="medication-section">
                                    <RenderBlocks blocks={medication.dosing_blocks} headerOffset={0} />
                                </div>
                                <h2>Contraindications</h2>
                                <div className="medication-section">
                                    <RenderBlocks blocks={medication.contra_indications_blocks} headerOffset={0} />
                                </div>
                                <h2>Warnings</h2>
                                <div className="medication-section">
                                    <RenderBlocks blocks={medication.warning_blocks} headerOffset={0} />
                                </div>

                                <SimilarMedicationsList
                                    medicationSlugs={Object.keys(medication.vector_similar_ranking ?? {})}/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Sidebar - Hidden on mobile, visible on desktop */}
                <MedicationAssistant/>
            </div>
        </div>
    );
} 