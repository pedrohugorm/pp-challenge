import Link from 'next/link';
import { fetchMedicationBySlug } from '@/services/medicationService';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import MedicationHeader from '@/components/MedicationHeader';
import MedicationAssistant from '@/components/MedicationAssistant';
import DOMPurify from "dompurify";
import { JSDOM } from 'jsdom';
import SimilarMedicationsList from "@/components/SimilarMedicationsList";

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

export async function generateMetadata({ params }: MedicationPageProps): Promise<Metadata> {
    const resolvedParams = await params;
    const medication = await getMedicationData(resolvedParams.slug);

    if (!medication) {
        return {
            title: 'Medication Not Found',
        };
    }

    return {
        title: `${medication.name} - ${medication.labeler.name}`,
        description: medication.description,
    };
}

const cleanHtml = (html: string) => {
    const window = new JSDOM('').window;
    return DOMPurify(window).sanitize(html);
}

export default async function MedicationPage({ params }: MedicationPageProps) {
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
                    <MedicationHeader title="Medication Search" />

                    <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
                        <div className="max-w-4xl mx-auto medication-document">
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

                            <div>
                                <h1>{medication.name}</h1>
                                <p>Labeler: {medication.labeler.name}</p>
                                <p>Generic name: {medication.generic_name}</p>
                                <p>Product type: {medication.product_type}</p>
                                <p>Effective date: {new Date(medication.effective_time).toLocaleDateString()}</p>

                                <div className="medication-section" dangerouslySetInnerHTML={{ __html: cleanHtml(medication.labeler.name) }}></div>

                                <h2>Description</h2>
                                <div className="medication-section" dangerouslySetInnerHTML={{ __html: cleanHtml(medication.ai_description) }}></div>
                                <h2>Use and Conditions</h2>
                                <div className="medication-section" dangerouslySetInnerHTML={{ __html: cleanHtml(medication.ai_use_and_conditions) }}></div>
                                <h2>Dosing and Administration</h2>
                                <div className="medication-section" dangerouslySetInnerHTML={{ __html: cleanHtml(medication.ai_dosing) }}></div>
                                <h2>Contraindications</h2>
                                <div className="medication-section" dangerouslySetInnerHTML={{ __html: cleanHtml(medication.ai_contraindications) }}></div>
                                <h2>Warnings</h2>
                                <div className="medication-section" dangerouslySetInnerHTML={{ __html: cleanHtml(medication.ai_warnings) }}></div>

                                <SimilarMedicationsList medicationSlugs={Object.keys(medication.vector_similar_ranking ?? {})} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Sidebar - Hidden on mobile, visible on desktop */}
                <MedicationAssistant />
            </div>
        </div>
    );
} 