import React from 'react';

interface SimplePillProps {
    text: string;
    className?: string;
}

export default function SimplePill({ text, className = '' }: SimplePillProps) {
    return (
        <div className={`pill pill-default cursor-pointer ${className}`}>
            {text}
        </div>
    );
} 