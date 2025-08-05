"use client"
import React, {useState, forwardRef, useImperativeHandle} from 'react';
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

export interface FilterPillContainerRef {
    clearFilters: () => void;
}

const FilterPillContainer =
    forwardRef<FilterPillContainerRef, FilterPillContainerProps>(({
                                                                      sectionName,
                                                                      options,
                                                                      onSelectionChange,
                                                                      allowMultiple = false,
                                                                      defaultExpanded = false
                                                                  }, ref) => {
        const [selectedValues, setSelectedValues] = useState<string[]>([]);
        const [isExpanded, setIsExpanded] = useState(defaultExpanded);

        // Expose clearFilters method to parent component
        useImperativeHandle(ref, () => ({
            clearFilters: () => {
                setSelectedValues([]);
                onSelectionChange?.([]);
            }
        }));

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
                <div
                    className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                    onClick={toggleExpanded}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleExpanded();
                        }
                    }}
                    aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                >
                    <h3 className="text-sm font-semibold text-gray-700">{sectionName}</h3>
                    <svg
                        className={`w-4 h-4 transition-transform duration-200 text-gray-500 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
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
    });

export default FilterPillContainer; 