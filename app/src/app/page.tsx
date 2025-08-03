'use client';

import React, {useEffect, useState} from 'react';
import { useSearchParams } from 'next/navigation';
import MedicationCard from '../components/MedicationCard';
import MedicationAssistant from '../components/MedicationAssistant';
import MedicationHeader from '../components/MedicationHeader';
import {fetchMedications, searchMedications, type Medication} from '@/services/medicationService';

export default function Home() {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        const loadMedications = async () => {
            try {
                setLoading(true);
                const query = searchParams.get('q');
                
                if (query) {
                    // Perform search
                    const searchResults = await searchMedications(query);
                    console.log('Search results:', searchResults);
                    setMedications(searchResults.medications);
                } else {
                    // Load all medications
                    const data = await fetchMedications();
                    setMedications(data.medications);
                }
                setError(null);
            } catch (err) {
                setError('Failed to load medications');
                console.error('Error loading medications:', err);
            } finally {
                setLoading(false);
            }
        };

        loadMedications();
    }, [searchParams]);
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex h-screen">
                {/* Main Content - Medication Cards */}
                <div className="flex-1 flex flex-col">
                    <MedicationHeader searchQuery={searchParams.get('q') || ""} />
                    <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
                        {loading && (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-gray-500">Loading medications...</div>
                            </div>
                        )}

                        {error && (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-red-500">{error}</div>
                            </div>
                        )}

                        {!loading && !error && medications.length === 0 && (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-gray-500">No medications found</div>
                            </div>
                        )}

                        {!loading && !error && medications.length > 0 && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6">
                                {medications.map((med: Medication) => (
                                    <MedicationCard key={med.id} medication={med}/>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Sidebar - Hidden on mobile, visible on desktop */}
                <MedicationAssistant/>
            </div>
        </div>
    );
}
