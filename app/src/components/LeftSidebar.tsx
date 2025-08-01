"use client"
import React, { useRef, useState, useEffect } from 'react';
import FilterPillContainer from './FilterPillContainer';
import { fetchTagsByCategory, type TagCategory } from '@/services/tagService';

interface LeftSidebarProps {
    onFilterChange?: (filters: { [key: string]: string[] }) => void;
}

export default function LeftSidebar({ onFilterChange }: LeftSidebarProps) {
    const [filterCategories, setFilterCategories] = useState<TagCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [allFilters, setAllFilters] = useState<{ [key: string]: string[] }>({});
    const filterRefs = useRef<{ [key: string]: { clearFilters: () => void } | null }>({});

    // Fetch tags by category from the API
    useEffect(() => {
        const loadFilterCategories = async () => {
            try {
                setLoading(true);
                const categories = await fetchTagsByCategory();
                setFilterCategories(categories);
            } catch (error) {
                console.error('Error loading filter categories:', error);
                // Set empty array if API fails - user will see loading state
                setFilterCategories([]);
            } finally {
                setLoading(false);
            }
        };

        loadFilterCategories();
    }, []);

    const handleFilterChange = (categoryId: string, selectedValues: string[]) => {
        console.log(`Filter change for ${categoryId}:`, selectedValues);
        
        // Update the complete filter state
        const newFilters = {
            ...allFilters,
            [categoryId]: selectedValues
        };
        
        // Remove empty filter categories
        Object.keys(newFilters).forEach(key => {
            if (newFilters[key].length === 0) {
                delete newFilters[key];
            }
        });
        
        setAllFilters(newFilters);
        
        // Notify parent component about the complete filter state
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    const handleClearFilters = () => {
        // Clear all filter containers
        Object.values(filterRefs.current).forEach(ref => {
            if (ref) {
                ref.clearFilters();
            }
        });
        
        // Clear the filter state
        setAllFilters({});
        
        // Navigate to the base page without any query parameters
        window.location.href = '/';
    };

    if (loading) {
        return (
            <div className="hidden lg:flex w-80 bg-white border-r border-gray-200 flex-col">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-semibold text-gray-800">Filters</div>
                            <p className="text-sm text-gray-600 mt-1">Loading filters...</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="hidden lg:flex w-80 bg-white border-r border-gray-200 flex-col">
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-lg font-semibold text-gray-800">Filters</div>
                        <p className="text-sm text-gray-600 mt-1">Filter medications</p>
                    </div>
                    <button
                        onClick={handleClearFilters}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {filterCategories.map((category) => (
                    <FilterPillContainer
                        key={category.id}
                        ref={(ref) => {
                            filterRefs.current[category.id] = ref;
                        }}
                        sectionName={category.name}
                        options={category.options}
                        onSelectionChange={(selectedValues) => handleFilterChange(category.id, selectedValues)}
                        allowMultiple={true}
                    />
                ))}
            </div>
        </div>
    );
} 