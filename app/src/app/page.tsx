'use client';

import React, {useEffect, useState, Suspense} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MedicationCard from '../components/MedicationCard';
import MedicationAssistant from '../components/MedicationAssistant';
import MedicationHeader from '../components/MedicationHeader';
import LeftSidebar from '../components/LeftSidebar';
import {fetchMedications, searchMedications, searchMedicationsWithFilters, type Medication, type SearchFilters} from '@/services/medicationService';

function SearchableContent() {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        const loadMedications = async () => {
            try {
                setLoading(true);
                const query = searchParams.get('q');
                
                // Extract filters from URL parameters
                const filters: SearchFilters = {};
                Array.from(searchParams.entries()).forEach(([key, value]) => {
                    if (key.startsWith('filter_')) {
                        const categoryId = key.replace('filter_', '');
                        filters[categoryId] = value.split(',').filter(v => v.trim() !== '');
                    }
                });
                
                console.log('SearchableContent - URL changed:', {
                    query,
                    filters,
                    allParams: Array.from(searchParams.entries())
                });
                
                if (query || Object.keys(filters).length > 0) {
                    // Use search endpoint when there's a query OR filters (or both)
                    const searchResults = await searchMedications(query || '', filters);
                    console.log('Search results:', searchResults);
                    setMedications(searchResults.medications);
                } else {
                    // Load all medications only when there's no query and no filters
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
        <div className="flex-1 flex flex-col">
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
    );
}

export default function Home() {
    const [currentFilters, setCurrentFilters] = useState<{ [key: string]: string[] }>({});
    const router = useRouter();
    const searchParams = useSearchParams();

    // Update URL when filters change
    const updateUrlWithFilters = (filters: { [key: string]: string[] }) => {
        const params = new URLSearchParams(searchParams.toString());
        
        // Remove existing filter parameters
        Array.from(params.keys()).forEach(key => {
            if (key !== 'q' && key.startsWith('filter_')) {
                params.delete(key);
            }
        });
        
        // Add new filter parameters
        Object.entries(filters).forEach(([categoryId, values]) => {
            if (values.length > 0) {
                params.set(`filter_${categoryId}`, values.join(','));
            }
        });
        
        // Preserve the search query
        const query = searchParams.get('q');
        if (query) {
            params.set('q', query);
        }
        
        const newUrl = `/?${params.toString()}`;
        console.log('Updating URL to:', newUrl);
        router.push(newUrl);
    };

    const handleFilterChange = (filters: { [key: string]: string[] }) => {
        console.log('Filter change detected:', filters);
        setCurrentFilters(filters);
        updateUrlWithFilters(filters);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header spans full width */}
            <div className="w-full">
                <MedicationHeader 
                    searchQuery={searchParams.get('q') || ""} 
                    onFilterChange={handleFilterChange}
                />
            </div>
            
            {/* Content area below header */}
            <div className="flex h-[calc(100vh-80px)]">
                {/* Left Sidebar - Hidden on mobile, visible on desktop */}
                <LeftSidebar onFilterChange={handleFilterChange} />

                {/* Main Content - Medication Cards */}
                <Suspense fallback={
                    <div className="flex-1 flex flex-col">
                        <div className="flex justify-center items-center h-full">
                            <div className="text-gray-500">Loading...</div>
                        </div>
                    </div>
                }>
                    <SearchableContent />
                </Suspense>

                {/* Chat Sidebar - Hidden on mobile, visible on desktop */}
                <MedicationAssistant/>
            </div>
        </div>
    );
}
