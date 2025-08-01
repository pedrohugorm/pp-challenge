"use client"
import React from 'react';

interface FilterPillProps {
    text: string;
    value: string;
    isSelected: boolean;
    onSelect: (value: string) => void;
}

export default function FilterPill({ text, value, isSelected, onSelect }: FilterPillProps) {
    const handleClick = () => {
        onSelect(value);
    };

    return (
        <button
            onClick={handleClick}
            className={`pill pill-focus ${
                isSelected ? 'pill-selected' : 'pill-default'
            }`}
        >
            {text}
        </button>
    );
} 