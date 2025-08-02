import {BlockContent} from "@/utils/renderBlocks";

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    time: string;
    notes?: string;
    blocks_json: Record<string, BlockContent[]>;
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
        const response = await fetch(`${getBackendUrl()}/medications/${slug}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return  await response.json();
    } catch (error) {
        console.error('Error fetching medication by slug:', error);
        throw error;
    }
} 