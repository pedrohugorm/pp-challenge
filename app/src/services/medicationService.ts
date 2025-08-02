export interface Block {
    type: string;
    contents: (string | Block)[];
}

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    time: string;
    notes?: string;
    blocks_json: Record<string, Block[]>;
}

export interface MedicationResponse {
    medications: Medication[];
}

import { getBackendUrl } from '../utils/getBackendUrl';

export async function fetchMedications(): Promise<MedicationResponse> {
    try {
        const response = await fetch(`${getBackendUrl()}/medications`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const medications = await response.json();
        return medications;
    } catch (error) {
        console.error('Error fetching medications:', error);
        // Return empty array on error to prevent app crash
        return { medications: [] };
    }
} 