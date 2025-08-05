"use client"
import React from 'react';
import FilterPillContainer from './FilterPillContainer';

export default function LeftSidebar() {
    const medicationTypes = [
        { text: 'Tablets', value: 'tablet' },
        { text: 'Capsules', value: 'capsule' },
        { text: 'Injections', value: 'injection' },
        { text: 'Liquids', value: 'liquid' },
        { text: 'Creams', value: 'cream' },
        { text: 'Inhalers', value: 'inhaler' }
    ];

    const handleFilterChange = (selectedValues: string[]) => {
        console.log('Selected filter values:', selectedValues);
        // Here you can implement the filtering logic
    };

    return (
        <div className="hidden lg:flex w-80 bg-white border-r border-gray-200 flex-col">
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-lg font-semibold text-gray-800">Filters</div>
                        <p className="text-sm text-gray-600 mt-1">Filter medications</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <FilterPillContainer
                    sectionName="Medication Types"
                    options={medicationTypes}
                    onSelectionChange={handleFilterChange}
                    allowMultiple={true}
                />
            </div>
        </div>
    );
} 