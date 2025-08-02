import React from 'react';

interface MedicationHeaderProps {
    title?: string;
}

const MedicationHeader: React.FC<MedicationHeaderProps> = ({ title = "Medication Search" }) => {
    return (
        <div 
            className="text-2xl lg:text-3xl font-bold font-sans text-white px-4 py-3 flex items-center gap-3"
            style={{ backgroundColor: '#355B72' }}
        >
            <img 
                src="/images/logo.jpg" 
                alt="Logo" 
                className="h-8 w-8 object-cover rounded border-2 border-white"
            />
            {title}
        </div>
    );
};

export default MedicationHeader; 