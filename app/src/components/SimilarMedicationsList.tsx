import React from 'react';
import SimilarReferenceMedicationCard from './SimilarReferenceMedicationCard';

interface SimilarMedicationsListProps {
    medicationSlugs: string[];
    title?: string;
}

export default function SimilarMedicationsList({ 
    medicationSlugs, 
    title = "Similar Medications" 
}: SimilarMedicationsListProps) {
    if (!medicationSlugs || medicationSlugs.length === 0) {
        return null;
    }

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
            
            {/* SEO: Hidden list of medication links for search engines */}
            <div hidden>
                <ul>
                    {medicationSlugs.map((slug, index) => (
                        <li key={`seo-${slug}-${index}`}>
                            <a href={`/medications/${slug}`}>{slug}</a>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6">
                {medicationSlugs.map((slug, index) => (
                    <SimilarReferenceMedicationCard 
                        key={`${slug}-${index}`} 
                        medicalSlug={slug} 
                    />
                ))}
            </div>
        </div>
    );
} 