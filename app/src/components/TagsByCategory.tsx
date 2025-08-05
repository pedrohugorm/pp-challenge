import React from 'react';
import ClickableSimplePill from './ClickableSimplePill';

interface TagsByCategoryProps {
    tagsByCategory: Record<string, string[]> | null | undefined;
    categoryKeys: string[];
    className?: string;
}

export default function TagsByCategory({ tagsByCategory, categoryKeys, className = '' }: TagsByCategoryProps) {
    if (!tagsByCategory) {
        return null;
    }

    const validCategories = categoryKeys.filter(key => 
        tagsByCategory[key] && tagsByCategory[key].length > 0
    );

    if (validCategories.length === 0) {
        return null;
    }

    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {validCategories.map(categoryKey => 
                tagsByCategory[categoryKey].map((tag: string) => (
                    <ClickableSimplePill 
                        key={`${categoryKey}-${tag}`} 
                        text={tag} 
                        category={categoryKey}
                    />
                ))
            )}
        </div>
    );
} 