"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from './SearchBar';

interface MedicationHeaderProps {
    title?: string;
    onSearch?: (query: string) => void;
    searchQuery?: string;
}

const MedicationHeader: React.FC<MedicationHeaderProps> = ({ 
    title = "Medication Search",
    onSearch,
    searchQuery = ""
}) => {
    const router = useRouter();

    const handleSearch = (query: string) => {
        if (onSearch) {
            onSearch(query);
        }
        
        // Redirect to home page with search query as URL parameter
        router.push(`/?q=${encodeURIComponent(query)}`);
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
                <SearchBar onSearch={handleSearch} initialValue={searchQuery} />
            </div>
        </div>
    );
};

export default MedicationHeader; 