import React from 'react';
import MedicationCard from '../components/MedicationCard';
import MedicationAssistant from '../components/MedicationAssistant';
import MedicationHeader from '../components/MedicationHeader';

interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    time: string;
    notes?: string;
}

const sampleMedications: Medication[] = [
    {
        id: '1',
        name: 'Aspirin',
        dosage: '100mg',
        frequency: 'Once daily',
        time: 'Morning',
        notes: 'Take with food'
    },
    {
        id: '2',
        name: 'Vitamin D',
        dosage: '1000 IU',
        frequency: 'Once daily',
        time: 'Morning',
        notes: 'Take with breakfast'
    },
    {
        id: '3',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        time: 'Morning & Evening',
        notes: 'Take with meals'
    },
    {
        id: '4',
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        time: 'Morning',
        notes: 'Take on empty stomach'
    },
    {
        id: '5',
        name: 'Atorvastatin',
        dosage: '20mg',
        frequency: 'Once daily',
        time: 'Evening',
        notes: 'Take with dinner'
    },
    {
        id: '6',
        name: 'Omeprazole',
        dosage: '20mg',
        frequency: 'Once daily',
        time: 'Morning',
        notes: 'Take 30 minutes before breakfast'
    }
];

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex h-screen">
                {/* Main Content - Medication Cards */}
                <div className="flex-1 flex flex-col">
                    <MedicationHeader />
                    <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
                        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6">
                            {sampleMedications.map((med: Medication) => (
                                <MedicationCard key={med.id} medication={med} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chat Sidebar - Hidden on mobile, visible on desktop */}
                <MedicationAssistant />
            </div>
        </div>
    );
}
