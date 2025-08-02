import React from 'react';
import { type Medication } from '../services/medicationService';
import { RenderBlocks } from '../utils/renderBlocks';

interface MedicationCardProps {
    medication: Medication;
}

export default function MedicationCard({ medication }: MedicationCardProps) {
    return (
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2 lg:mb-3">
                <h3 className="font-semibold text-gray-800 text-lg lg:text-xl">
                    {medication.name}
                </h3>
                <span className="text-sm bg-blue-100 text-blue-800 rounded-full font-medium px-2 lg:px-3 py-1">
                    {medication.dosage}
                </span>
            </div>
            <div className="space-y-1 lg:space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Frequency:</span> {medication.frequency}</p>
                <p><span className="font-medium">Time:</span> {medication.time}</p>
                {medication.notes && (
                    <p><span className="font-medium">Notes:</span> {medication.notes}</p>
                )}
                <RenderBlocks blocks={medication.blocks_json.description} />
            </div>
        </div>
    );
}