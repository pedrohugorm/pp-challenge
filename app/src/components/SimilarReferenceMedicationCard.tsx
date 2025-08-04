"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { type Medication, fetchMedicationBySlug } from '@/services/medicationService';
import DOMPurify from "dompurify";
import {renderBlocks} from "@/utils/renderBlocks";

interface SimilarReferenceMedicationCardProps {
    medicalSlug: string;
}

const cleanHtml = (html: string) => {
    return DOMPurify(window).sanitize(html);
}

export default function SimilarReferenceMedicationCard({ medicalSlug }: SimilarReferenceMedicationCardProps) {
    const [medication, setMedication] = useState<Medication | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMedication = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchMedicationBySlug(medicalSlug);
                setMedication(data);
            } catch (err) {
                setError('Failed to load medication');
                console.error('Error fetching medication:', err);
            } finally {
                setLoading(false);
            }
        };

        if (medicalSlug) {
            fetchMedication();
        }
    }, [medicalSlug]);

    if (loading) {
        return (
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4 lg:p-6 h-full flex flex-col">
                <div className="animate-pulse flex-grow">
                    <div className="h-6 bg-gray-200 rounded mb-2 lg:mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error || !medication) {
        return (
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4 lg:p-6 h-full flex flex-col">
                <div className="text-red-500 text-sm flex-grow">
                    {error || 'Medication not found'}
                </div>
            </div>
        );
    }

    return (
        <Link href={`/medications/${medication.slug}`} className="block h-full">
            <div
                className="bg-white rounded-md shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                <div className="flex justify-between items-start mb-2 lg:mb-3">
                    <h3 className="font-semibold text-gray-800 text-lg lg:text-xl">{medication.name} ({medication.generic_name})</h3>
                </div>
                <div className="space-y-1 lg:space-y-2 text-sm text-gray-600">
                    <p>Labeler: {medication.labeler.name}</p>
                </div>
                <div className="space-y-1 lg:space-y-2 text-sm text-gray-600 flex-grow">{renderBlocks(medication.meta_description_blocks, 0)}</div>
            </div>
        </Link>
    );
} 