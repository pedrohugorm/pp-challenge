"use client"
import React from 'react';

interface FilterPillProps {
    text: string;
    value: string;
    isSelected: boolean;
    onSelect: (value: string) => void;
}

export default function FilterPill({ text, value, isSelected, onSelect }: FilterPillProps) {
    const handleClick = () => {
        onSelect(value);
    };

    return (
        <button
            onClick={handleClick}
            className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${isSelected 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
            `}
        >
            {text}
        </button>
    );
} 