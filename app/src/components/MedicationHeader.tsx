"use client"

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchBar from './SearchBar';

interface MedicationHeaderProps {
    title?: string;
    onSearch?: (query: string) => void;
    searchQuery?: string;
    onFilterChange?: (filters: { [key: string]: string[] }) => void;
}

const MedicationHeader: React.FC<MedicationHeaderProps> = ({ 
    title = "Medication Search",
    onSearch,
    searchQuery = "",
    onFilterChange
}) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSearch = (query: string) => {
        if (onSearch) {
            onSearch(query);
        }
        
        // Update URL with search query and current filters
        const params = new URLSearchParams();
        params.set('q', query);
        
        // Add current filters to URL
        Array.from(searchParams.entries()).forEach(([key, value]) => {
            if (key.startsWith('filter_')) {
                params.set(key, value);
            }
        });
        
        router.push(`/?${params.toString()}`);
    };

    return (
        <div 
            className="text-2xl lg:text-3xl font-bold font-sans text-white px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: '#355B72' }}
        >
            <div className="flex items-center gap-3">
                {title}
            </div>
            <div className="flex items-center">
                <SearchBar onSearch={handleSearch} initialValue={searchQuery} onFilterChange={onFilterChange} />
            </div>
        </div>
    );
};

export default MedicationHeader; 