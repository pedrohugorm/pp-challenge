import React from 'react';

interface SimplePillProps {
    text: string;
    className?: string;
    category?: string;
    onClick?: () => void;
}

export default function SimplePill({ text, className = '', onClick }: SimplePillProps) {
    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    return (
        <div 
            className={`pill pill-default cursor-pointer ${className}`}
            onClick={handleClick}
        >
            {text}
        </div>
    );
} 