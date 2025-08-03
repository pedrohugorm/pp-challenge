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
}

export interface MedicationResponse {
    medications: Medication[];
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

export async function searchMedications(query: string): Promise<MedicationResponse> {
    try {
        const response = await fetch(`${getBackendUrl()}/medications/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
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