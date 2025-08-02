import React from 'react';

export interface BlockContent {
    type: string;
    contents: (string | BlockContent)[];
}

interface RenderBlockProps {
    block: BlockContent;
}

export function renderBlock({ block }: RenderBlockProps): React.ReactElement {
    const { type, contents } = block;
    
    // Validate that type is a valid HTML tag
    const validHtmlTags = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 
        'ul', 'ol', 'li', 'a'
    ];
    
    if (!validHtmlTags.includes(type)) {
        console.warn(`Invalid HTML tag type: ${type}. Falling back to div.`);
        return React.createElement('div', {}, `Invalid tag: ${type}`);
    }
    
    // Process contents recursively
    const children: React.ReactNode[] = [];
    
    contents.forEach((content, index) => {
        if (typeof content === 'string') {
            children.push(content);
        } else if (content && typeof content === 'object' && 'type' in content && 'contents' in content) {
            // Recursively render nested blocks
            children.push(
                React.createElement(
                    React.Fragment,
                    { key: index },
                    renderBlock({ block: content as BlockContent })
                )
            );
        } else {
            // Handle invalid content
            console.warn('Invalid content in block:', content);
        }
    });
    
    // Create the element dynamically
    const props = {};
    return React.createElement(type, props, ...children);
}

// Utility function to render multiple blocks
export function renderBlocks(blocks: BlockContent[]): React.ReactElement[] {
    return blocks.map((block, index) => 
        React.createElement(React.Fragment, { key: index }, renderBlock({ block }))
    );
}

// React component for easy usage
interface RenderBlocksProps {
    blocks: BlockContent[];
}

export function RenderBlocks({ blocks }: RenderBlocksProps): React.ReactElement {
    if (!Array.isArray(blocks)) {
        console.warn('RenderBlocks: blocks prop should be an array');
        return React.createElement('div', {}, 'Invalid blocks data');
    }
    
    return React.createElement(React.Fragment, {}, ...renderBlocks(blocks));
}
