import {BlockContent} from "@/utils/renderBlocks";

export interface Medication {
    id: string;
    name: string;
    generic_name: string;
    slug: string;
    product_type: string;
    effective_time: Date;
    labeler: { name: string },
    description: string;
    meta_description: string;
    blocks_json: Record<string, string>;
    ai_description:string;
    ai_warnings:string;
    ai_dosing:string;
    ai_use_and_conditions:string;
    ai_contraindications:string;
    vector_similar_ranking: Record<string, number>;
    meta_description_blocks: BlockContent[];
    description_blocks: BlockContent[];
    use_and_conditions_blocks: BlockContent[];
    contra_indications_blocks: BlockContent[];
    warning_blocks: BlockContent[];
    dosing_blocks: BlockContent[];
}

export interface MedicationResponse {
    medications: Medication[];
}

export interface SearchFilters {
    [key: string]: string[];
}

import {getBackendUrl} from '@/utils/getBackendUrl';

export async function fetchMedications(): Promise<MedicationResponse> {
    try {
        const response = await fetch(`${getBackendUrl()}/medications`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching medications:', error);
        // Return an empty array on error to prevent an app crash
        return {medications: []};
    }
}

export async function fetchMedicationBySlug(slug: string): Promise<Medication> {
    try {
        const response = await fetch(`${getBackendUrl()}/medications/${slug}`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching medication by slug:', error);
        throw error;
    }
}

export async function searchMedications(query: string, filters?: SearchFilters): Promise<MedicationResponse> {
    try {
        // Map generic filters to backend-specific tag categories
        const mappedFilters: { [key: string]: string[] } = {};
        
        if (filters) {
            const tagMapping: { [key: string]: string } = {
                'conditions': 'tags_condition',
                'substances': 'tags_substance', 
                'indications': 'tags_indications',
                'strengths_concentrations': 'tags_strengths_concentrations',
                'populations': 'tags_population'
            };
            
            Object.entries(filters).forEach(([categoryId, values]) => {
                const backendKey = tagMapping[categoryId];
                if (backendKey && values.length > 0) {
                    mappedFilters[backendKey] = values;
                }
            });
        }
        
        console.log('Sending search request with query:', query);
        console.log('Mapped filters:', mappedFilters);
        
        const response = await fetch(`${getBackendUrl()}/medications/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                query,
                ...mappedFilters
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error searching medications:', error);
        // Return an empty array on error to prevent an app crash
        return { medications: [] };
    }
}

 