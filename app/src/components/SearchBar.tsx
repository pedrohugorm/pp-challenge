"use client"

import React, { useState } from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    initialValue?: string;
    onFilterChange?: (filters: { [key: string]: string[] }) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
    onSearch, 
    placeholder = "Search medications...",
    initialValue = "",
    onFilterChange
}) => {
    const [query, setQuery] = useState(initialValue);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyUp={handleKeyPress}
                    placeholder={placeholder}
                    className="w-64 px-4 py-2 pr-10 text-sm font-normal bg-white text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
                <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                        />
                    </svg>
                </button>
            </div>
        </form>
    );
};

export default SearchBar; 