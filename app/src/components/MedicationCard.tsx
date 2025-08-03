import React from 'react';
import Link from 'next/link';
import {type Medication} from '@/services/medicationService';
import DOMPurify from "dompurify";

interface MedicationCardProps {
    medication: Medication;
}

const cleanHtml = (html: string) => {
    return DOMPurify(window).sanitize(html);
}

export default function MedicationCard({medication}: MedicationCardProps) {
    return (
        <Link href={`/medications/${medication.slug}`} className="block h-full">
            <div
                className="bg-white rounded-md shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                <div className="flex justify-between items-start mb-2 lg:mb-3">
                    <h2 className="font-semibold text-gray-800 text-lg lg:text-xl">{medication.name} ({medication.generic_name})</h2>
                </div>
                <div className="space-y-1 lg:space-y-2 text-sm text-gray-600">
                    <p>Labeler: {medication.labeler.name}</p>
                </div>
                <div className="space-y-1 lg:space-y-2 text-sm text-gray-600 flex-grow"
                     dangerouslySetInnerHTML={{__html: cleanHtml(medication.meta_description)}}></div>
            </div>
        </Link>
    );
}