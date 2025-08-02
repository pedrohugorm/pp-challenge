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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function fetchMedications(): Promise<MedicationResponse> {
    try {
        const response = await fetch(`${BACKEND_URL}/medications`);
        
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