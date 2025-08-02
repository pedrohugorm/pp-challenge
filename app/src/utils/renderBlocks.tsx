import React from 'react';

export interface EmbedMedicationData {
    id: string;
    name: string;
    slug: string;
}

export interface BlockContent {
    type: string;
    contents: (string | BlockContent | EmbedMedicationData)[];
}

interface RenderBlockProps {
    block: BlockContent;
}

export function renderBlock({ block }: RenderBlockProps): React.ReactElement {
    const { type, contents } = block;
    
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
    
    // Check if there's a custom component for this type
    if (componentMap[type]) {
        const CustomComponent = componentMap[type];
        return React.createElement(CustomComponent, { contents }, ...children);
    }
    
    // Validate that type is a valid block type for fallback
    const validBlockTypes = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 
        'ul', 'ol', 'li', 'a', 'table', 'tr', 'th', 'td', 'mark', 'embed-medication'
    ];
    
    if (!validBlockTypes.includes(type)) {
        console.warn(`Invalid block type: ${type}. Falling back to div.`);
        return React.createElement('div', {}, `Invalid block type: ${type}`);
    }
    
    // Create the element dynamically
    const props = {};
    return React.createElement(type, props, ...children);
}

// Header component for h1, h2, h3, etc.
const Header = ({ level, children }: { level: number; children: React.ReactNode }) => {
    switch (level) {
        case 1: return <h1>{children}</h1>;
        case 2: return <h2>{children}</h2>;
        case 3: return <h3>{children}</h3>;
        case 4: return <h4>{children}</h4>;
        case 5: return <h5>{children}</h5>;
        case 6: return <h6>{children}</h6>;
        default: return <h1>{children}</h1>;
    }
};

// Paragraph component
const Paragraph = ({ children }: { children: React.ReactNode }) => {
    return <p className="text-gray-600 leading-relaxed mb-4">{children}</p>;
};

// List component with type handling
const List = ({ listType, children }: { listType: 'ul' | 'ol'; children: React.ReactNode }) => {
    const listClasses = {
        'ul': 'list-disc list-inside space-y-1 mb-4',
        'ol': 'list-decimal list-inside space-y-1 mb-4'
    };
    
    const className = listClasses[listType];
    
    return listType === 'ul' ? 
        <ul className={className}>{children}</ul> : 
        <ol className={className}>{children}</ol>;
};

// Table component
const Table = ({ children }: { children: React.ReactNode }) => {
    return <table className="w-full border-collapse border border-gray-300 mb-4">{children}</table>;
};

// Table row component
const TableRow = ({ children }: { children: React.ReactNode }) => {
    return <tr className="border-b border-gray-300">{children}</tr>;
};

// Table cell component
const TableCell = ({ isHeader, children }: { isHeader?: boolean; children: React.ReactNode }) => {
    const className = `px-4 py-2 text-left ${isHeader ? 'font-semibold bg-gray-100' : ''}`;
    
    return isHeader ? 
        <th className={className}>{children}</th> : 
        <td className={className}>{children}</td>;
};

// Link component
const Link = ({ href, children }: { href?: string; children: React.ReactNode }) => {
    return <a href={href || '#'} className="text-blue-600 hover:text-blue-800 underline">{children}</a>;
};

// Mark component for inline formatting
const Mark = ({ format, children }: { format: string; children: React.ReactNode }) => {
    const formatClasses = {
        'strong': 'font-semibold text-gray-800',
        'em': 'italic text-gray-700',
        'code': 'bg-gray-100 px-1 py-0.5 rounded text-sm font-mono',
        'mark': 'bg-yellow-200 px-1 py-0.5 rounded'
    };
    
    const className = formatClasses[format as keyof typeof formatClasses] || '';
    
    switch (format) {
        case 'strong': return <strong className={className}>{children}</strong>;
        case 'em': return <em className={className}>{children}</em>;
        case 'code': return <code className={className}>{children}</code>;
        case 'mark': return <mark className={className}>{children}</mark>;
        default: return <span className={className}>{children}</span>;
    }
};

// EmbedMedication component
const EmbedMedication = ({ contents }: { contents: (string | BlockContent | EmbedMedicationData)[] }) => {
    // Find the EmbedMedicationData in contents
    const medicationData = contents.find(content => 
        typeof content === 'object' && 
        content && 
        'id' in content && 
        'name' in content && 
        'slug' in content
    ) as EmbedMedicationData | undefined;
    
    if (!medicationData || !medicationData.name || !medicationData.slug) {
        console.warn('EmbedMedication: Missing required embed data (name or slug)');
        return <span className="text-red-500">Invalid medication link</span>;
    }
    
    return (
        <a 
            href={`/medication/${medicationData.slug}`} 
            className="text-blue-600 hover:text-blue-800 underline font-medium"
        >
            {medicationData.name}
        </a>
    );
};

// Component map
const componentMap: Record<string, React.ComponentType<any>> = {
    'h1': ({ children }: { children: React.ReactNode }) => <Header level={1}>{children}</Header>,
    'h2': ({ children }: { children: React.ReactNode }) => <Header level={2}>{children}</Header>,
    'h3': ({ children }: { children: React.ReactNode }) => <Header level={3}>{children}</Header>,
    'h4': ({ children }: { children: React.ReactNode }) => <Header level={4}>{children}</Header>,
    'h5': ({ children }: { children: React.ReactNode }) => <Header level={5}>{children}</Header>,
    'h6': ({ children }: { children: React.ReactNode }) => <Header level={6}>{children}</Header>,
    'p': ({ children }: { children: React.ReactNode }) => <Paragraph>{children}</Paragraph>,
    'ul': ({ children }: { children: React.ReactNode }) => <List listType="ul">{children}</List>,
    'ol': ({ children }: { children: React.ReactNode }) => <List listType="ol">{children}</List>,
    'li': ({ children }: { children: React.ReactNode }) => <li className="text-gray-600">{children}</li>,
    'table': ({ children }: { children: React.ReactNode }) => <Table>{children}</Table>,
    'tr': ({ children }: { children: React.ReactNode }) => <TableRow>{children}</TableRow>,
    'th': ({ children }: { children: React.ReactNode }) => <TableCell isHeader>{children}</TableCell>,
    'td': ({ children }: { children: React.ReactNode }) => <TableCell>{children}</TableCell>,
    'a': ({ children }: { children: React.ReactNode }) => <Link>{children}</Link>,
    'strong': ({ children }: { children: React.ReactNode }) => <Mark format="strong">{children}</Mark>,
    'em': ({ children }: { children: React.ReactNode }) => <Mark format="em">{children}</Mark>,
    'code': ({ children }: { children: React.ReactNode }) => <Mark format="code">{children}</Mark>,
    'mark': ({ children }: { children: React.ReactNode }) => <Mark format="mark">{children}</Mark>,
    'embed-medication': ({ contents }: { contents: (string | BlockContent | EmbedMedicationData)[] }) => <EmbedMedication contents={contents} />
};

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
        return React.createElement('p', {}, 'Invalid blocks data');
    }
    
    return React.createElement(React.Fragment, {}, ...renderBlocks(blocks));
}
