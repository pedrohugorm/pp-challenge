import { getBackendUrl } from '@/utils/getBackendUrl';

export interface Tag {
    id: number;
    name: string;
    category: string;
}

export interface TagCategory {
    id: string;
    name: string;
    options: { text: string; value: string }[];
}

export async function fetchTagsByCategory(): Promise<TagCategory[]> {
    try {
        const response = await fetch(`${getBackendUrl()}/medications/tags/categories`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const tags: Tag[] = await response.json();
        
        // Group tags by category
        const categoriesMap = new Map<string, Tag[]>();
        
        tags.forEach(tag => {
            if (!categoriesMap.has(tag.category)) {
                categoriesMap.set(tag.category, []);
            }
            categoriesMap.get(tag.category)!.push(tag);
        });
        
        // Convert to TagCategory format
        const categories: TagCategory[] = [];
        
        categoriesMap.forEach((tags, category) => {
            categories.push({
                id: category,
                name: formatCategoryName(category),
                options: tags.map(tag => ({
                    text: tag.name,
                    value: tag.name // Use original tag name as value
                }))
            });
        });
        
        return categories;
    } catch (error) {
        console.error('Error fetching tags by category:', error);
        throw error;
    }
}

function formatCategoryName(category: string): string {
    const categoryMap: { [key: string]: string } = {
        'conditions': 'Medical Conditions',
        'substances': 'Active Substances',
        'indications': 'Indications',
        'strengths_concentrations': 'Strengths & Concentrations',
        'populations': 'Target Populations',
        // 'contraindications': 'Contraindications'
    };
    
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
} 