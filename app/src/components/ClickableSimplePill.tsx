'use client';

import React from 'react';
import Link from 'next/link';

interface ClickableSimplePillProps {
    text: string;
    className?: string;
    category?: string;
}

export default function ClickableSimplePill({ text, className = '', category }: ClickableSimplePillProps) {
    if (!category) {
        return (
            <div className={`pill pill-default cursor-pointer ${className}`}>
                {text}
            </div>
        );
    }

    // Create the filter URL
    const params = new URLSearchParams();
    params.set(`filter_${category}`, text);
    const filterUrl = `/?${params.toString()}`;

    return (
        <Link 
            href={filterUrl}
            className={`pill pill-default cursor-pointer ${className}`}
            title={`Filter by ${text}`}
        >
            {text}
        </Link>
    );
} 