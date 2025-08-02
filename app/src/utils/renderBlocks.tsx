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
    headerOffset: number
}

export function renderBlock({block, headerOffset}: RenderBlockProps): React.ReactElement {
    const {type, contents} = block;

    // Process contents recursively
    const children: React.ReactNode[] = [];
    const componentMap = getComponentMap(headerOffset);

    contents.forEach((content, index) => {
        if (typeof content === 'string') {
            children.push(content);
        } else if (content && typeof content === 'object' && 'type' in content && 'contents' in content) {
            // Recursively render nested blocks
            children.push(
                React.createElement(
                    React.Fragment,
                    {key: index},
                    renderBlock({block: content as BlockContent, headerOffset})
                )
            );
        } else if (content && typeof content === 'object' && 'id' in content && 'name' in content && 'slug' in content) {
            // Handle embed medication data directly in contents
            const medicationData = content as EmbedMedicationData;
            children.push(
                React.createElement(
                    React.Fragment,
                    {key: index},
                    <EmbedMedication contents={[medicationData]}/>
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
        return React.createElement(CustomComponent, {contents}, ...children);
    }

    // Validate that type is a valid block type for fallback
    const validBlockTypes = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em',
        'ul', 'ol', 'li', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'mark', 'embed-medication'
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
const Header = ({level, children}: { level: number; children: React.ReactNode }) => {
    switch (level) {
        case 1:
            return <h1>{children}</h1>;
        case 2:
            return <h2>{children}</h2>;
        case 3:
            return <h3>{children}</h3>;
        case 4:
            return <h4>{children}</h4>;
        case 5:
            return <h5>{children}</h5>;
        case 6:
            return <h6>{children}</h6>;
        default:
            return <h1>{children}</h1>;
    }
};

// Paragraph component
const Paragraph = ({children}: { children: React.ReactNode }) => {
    return <p>{children}</p>;
};

// List component with type handling
const List = ({listType, children}: { listType: 'ul' | 'ol'; children: React.ReactNode }) => {
    return listType === 'ul' ?
        <ul>{children}</ul> :
        <ol>{children}</ol>;
};

// Table component
const Table = ({children}: { children: React.ReactNode }) => {
    return <table>{children}</table>;
};

// Table row component
const TableRow = ({children}: { children: React.ReactNode }) => {
    return <tr>{children}</tr>;
};

// Table cell component
const TableCell = ({isHeader, children}: { isHeader?: boolean; children: React.ReactNode }) => {
    return isHeader ?
        <th>{children}</th> :
        <td>{children}</td>;
};

// Link component
const Link = ({href, children}: { href?: string; children: React.ReactNode }) => {
    return <a href={href || '#'}>{children}</a>;
};

// Mark component for inline formatting
const Mark = ({format, children}: { format: string; children: React.ReactNode }) => {
    switch (format) {
        case 'strong':
            return <strong>{children}</strong>;
        case 'em':
            return <em>{children}</em>;
        case 'code':
            return <code>{children}</code>;
        case 'mark':
            return <mark>{children}</mark>;
        default:
            return <span>{children}</span>;
    }
};

// EmbedMedication component
const EmbedMedication = ({contents}: { contents: (string | BlockContent | EmbedMedicationData)[] }) => {
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
        return <span>Invalid medication link</span>;
    }

    return (
        <a href={`/medications/${medicationData.slug}`}>
            {medicationData.name}
        </a>
    );
};

// Component map
const getComponentMap = (headerOffset: number): Record<string, React.ComponentType<any>> => ({
    'h1': ({children}: { children: React.ReactNode }) => <Header level={1 + headerOffset}>{children}</Header>,
    'h2': ({children}: { children: React.ReactNode }) => <Header level={2 + headerOffset}>{children}</Header>,
    'h3': ({children}: { children: React.ReactNode }) => <Header level={3 + headerOffset}>{children}</Header>,
    'h4': ({children}: { children: React.ReactNode }) => <Header level={4 + headerOffset}>{children}</Header>,
    'h5': ({children}: { children: React.ReactNode }) => <Header level={5 + headerOffset}>{children}</Header>,
    'h6': ({children}: { children: React.ReactNode }) => <Header level={6 + headerOffset}>{children}</Header>,
    'p': ({children}: { children: React.ReactNode }) => <Paragraph>{children}</Paragraph>,
    'ul': ({children}: { children: React.ReactNode }) => <List listType="ul">{children}</List>,
    'ol': ({children}: { children: React.ReactNode }) => <List listType="ol">{children}</List>,
    'li': ({children}: { children: React.ReactNode }) => <li>{children}</li>,
    'table': ({children}: { children: React.ReactNode }) => <Table>{children}</Table>,
    'thead': ({children}: { children: React.ReactNode }) => <>{children}</>,
    'tbody': ({children}: { children: React.ReactNode }) => <>{children}</>,
    'tfoot': ({children}: { children: React.ReactNode }) => <>{children}</>,
    'caption': ({children}: { children: React.ReactNode }) => <caption>{children}</caption>,
    'tr': ({children}: { children: React.ReactNode }) => <TableRow>{children}</TableRow>,
    'th': ({children}: { children: React.ReactNode }) => <TableCell isHeader>{children}</TableCell>,
    'td': ({children}: { children: React.ReactNode }) => <TableCell>{children}</TableCell>,
    'a': ({children}: { children: React.ReactNode }) => <Link>{children}</Link>,
    'strong': ({children}: { children: React.ReactNode }) => <Mark format="strong">{children}</Mark>,
    'em': ({children}: { children: React.ReactNode }) => <Mark format="em">{children}</Mark>,
    'code': ({children}: { children: React.ReactNode }) => <Mark format="code">{children}</Mark>,
    'mark': ({children}: { children: React.ReactNode }) => <Mark format="mark">{children}</Mark>,
    'embed-medication': ({contents}: { contents: (string | BlockContent | EmbedMedicationData)[] }) => <EmbedMedication
        contents={contents}/>
});

// Utility function to render multiple blocks
export function renderBlocks(blocks: BlockContent[], headerOffset: number): React.ReactElement[] {
    if (!blocks) {
        return [];
    }

    return blocks.map((block, index) =>
        React.createElement(React.Fragment, {key: index}, renderBlock({block, headerOffset}))
    );
}

// React component for easy usage
interface RenderBlocksProps {
    blocks: BlockContent[];
    headerOffset: number;
}

export function RenderBlocks({blocks, headerOffset}: RenderBlocksProps): React.ReactElement {
    if (!Array.isArray(blocks)) {
        console.warn('RenderBlocks: blocks prop should be an array');
        return React.createElement('p', {}, 'Invalid blocks data');
    }

    return React.createElement(React.Fragment, {}, ...renderBlocks(blocks, headerOffset));
}


