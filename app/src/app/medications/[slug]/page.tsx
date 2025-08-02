import Link from 'next/link';
import { fetchMedicationBySlug } from '@/services/medicationService';
import { notFound } from 'next/navigation';

interface MedicationPageProps {
    params: {
        slug: string;
    };
}

export default async function MedicationPage({ params }: MedicationPageProps) {
    try {
        const resolvedParams = await params;
        const { medication } = await fetchMedicationBySlug(resolvedParams.slug);
        
        return (
            <div className="min-h-screen bg-gray-50">
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

                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {medication.name}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div>
                                <span className="font-medium">Dosage:</span> {medication.dosage}
                            </div>
                            <div>
                                <span className="font-medium">Frequency:</span> {medication.frequency}
                            </div>
                            <div>
                                <span className="font-medium">Time:</span> {medication.time}
                            </div>
                        </div>
                        {medication.notes && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                <h3 className="font-medium text-blue-900 mb-2">Notes:</h3>
                                <p className="text-blue-800">{medication.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Medication Details */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Medication Information
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Basic Information</h3>
                                <dl className="space-y-2">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Medication ID</dt>
                                        <dd className="text-sm text-gray-900">{medication.id}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Name</dt>
                                        <dd className="text-sm text-gray-900">{medication.name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Dosage</dt>
                                        <dd className="text-sm text-gray-900">{medication.dosage}</dd>
                                    </div>
                                </dl>
                            </div>
                            
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Schedule</h3>
                                <dl className="space-y-2">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Frequency</dt>
                                        <dd className="text-sm text-gray-900">{medication.frequency}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Time</dt>
                                        <dd className="text-sm text-gray-900">{medication.time}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>

                    {/* Blocks Information */}
                    {medication.blocks_json && Object.keys(medication.blocks_json).length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Additional Information
                            </h2>
                            <div className="space-y-4">
                                {Object.entries(medication.blocks_json).map(([key, blocks]) => (
                                    <div key={key} className="border-l-4 border-blue-500 pl-4">
                                        <h3 className="font-medium text-gray-900 mb-2 capitalize">
                                            {key.replace(/_/g, ' ')}
                                        </h3>
                                        <div className="space-y-2">
                                            {blocks.map((block, index) => (
                                                <div key={index} className="text-sm text-gray-700">
                                                    {block.type === 'p' && (
                                                        <p>{block.contents.join(' ')}</p>
                                                    )}
                                                    {block.type === 'ul' && (
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {block.contents.map((content, i) => (
                                                                <li key={i}>{typeof content === 'string' ? content : JSON.stringify(content)}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {block.type === 'ol' && (
                                                        <ol className="list-decimal list-inside space-y-1">
                                                            {block.contents.map((content, i) => (
                                                                <li key={i}>{typeof content === 'string' ? content : JSON.stringify(content)}</li>
                                                            ))}
                                                        </ol>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error loading medication:', error);
        notFound();
    }
} 