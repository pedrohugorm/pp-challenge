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
        <ul className={`tags flex flex-wrap gap-2 list-none p-0 m-0 ${className}`}>
            {validCategories.map(categoryKey => 
                tagsByCategory[categoryKey].map((tag: string) => (
                    <li key={`${categoryKey}-${tag}`} className="tag list-none">
                        <ClickableSimplePill 
                            text={tag} 
                            category={categoryKey}
                        />
                    </li>
                ))
            )}
        </ul>
    );
} 