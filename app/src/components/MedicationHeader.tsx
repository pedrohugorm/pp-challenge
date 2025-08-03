"use client"

import React from 'react';
import SearchBar from './SearchBar';

interface MedicationHeaderProps {
    title?: string;
    onSearch?: (query: string) => void;
}

const MedicationHeader: React.FC<MedicationHeaderProps> = ({ 
    title = "Medication Search",
    onSearch 
}) => {
    const handleSearch = (query: string) => {
        if (onSearch) {
            onSearch(query);
        }
        // TODO: Implement search functionality
        console.log('Search query:', query);
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
                <SearchBar onSearch={handleSearch} />
            </div>
        </div>
    );
};

export default MedicationHeader; 