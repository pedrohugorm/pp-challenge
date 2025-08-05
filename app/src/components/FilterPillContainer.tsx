"use client"
import React, { useState } from 'react';
import FilterPill from './FilterPill';

interface FilterOption {
    text: string;
    value: string;
}

interface FilterPillContainerProps {
    sectionName: string;
    options: FilterOption[];
    onSelectionChange?: (selectedValues: string[]) => void;
    allowMultiple?: boolean;
    defaultExpanded?: boolean;
}

export default function FilterPillContainer({ 
    sectionName, 
    options, 
    onSelectionChange,
    allowMultiple = false,
    defaultExpanded = true
}: FilterPillContainerProps) {
    const [selectedValues, setSelectedValues] = useState<string[]>([]);
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const handlePillSelect = (value: string) => {
        let newSelectedValues: string[];
        
        if (allowMultiple) {
            // Toggle selection for multiple mode
            if (selectedValues.includes(value)) {
                newSelectedValues = selectedValues.filter(v => v !== value);
            } else {
                newSelectedValues = [...selectedValues, value];
            }
        } else {
            // Single selection mode
            newSelectedValues = selectedValues.includes(value) ? [] : [value];
        }
        
        setSelectedValues(newSelectedValues);
        onSelectionChange?.(newSelectedValues);
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">{sectionName}</h3>
                <button
                    onClick={toggleExpanded}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                >
                    <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
            
            {isExpanded && (
                <div className="flex flex-wrap gap-2">
                    {options.map((option) => (
                        <FilterPill
                            key={option.value}
                            text={option.text}
                            value={option.value}
                            isSelected={selectedValues.includes(option.value)}
                            onSelect={handlePillSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
} 