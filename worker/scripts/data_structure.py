import json
from bs4 import BeautifulSoup, Tag, NavigableString

def parse_html_element(element):
    """Parse an HTML element and return a structured object based on its type."""
    if not isinstance(element, Tag):
        return {"type": "text", "text": str(element)}
    
    tag_name = element.name.lower()
    
    # Handle headers (h1, h2, h3, h4, h5, h6)
    if tag_name.startswith('h') and len(tag_name) == 2 and tag_name[1].isdigit():
        return {
            "type": "header",
            "text": element.get_text().strip()
        }
    
    # Handle paragraphs
    elif tag_name == 'p':
        return {
            "type": "paragraph", 
            "text": element.get_text().strip()
        }
    
    # Handle ordered lists
    elif tag_name == 'ol':
        items = []
        for li in element.find_all('li', recursive=False):
            items.append(li.get_text().strip())
        return {
            "type": "ordered-list",
            "items": items
        }
    
    # Handle unordered lists
    elif tag_name == 'ul':
        items = []
        for li in element.find_all('li', recursive=False):
            items.append(li.get_text().strip())
        return {
            "type": "unordered-list",
            "items": items
        }
    
    # Handle list items (if they appear outside of ul/ol)
    elif tag_name == 'li':
        return {
            "type": "list-item",
            "text": element.get_text().strip()
        }
    
    # Handle tables
    elif tag_name == 'table':
        rows = []
        for tr in element.find_all('tr', recursive=False):
            row_data = []
            for cell in tr.find_all(['td', 'th'], recursive=False):
                # Parse the cell content recursively
                cell_content = structure_json_html(str(cell))
                row_data.append({
                    "type": "table-cell",
                    "content": cell_content
                })
            if row_data:  # Only add non-empty rows
                rows.append({
                    "type": "table-row",
                    "items": row_data
                })
        return {
            "type": "table",
            "rows": rows
        }
    
    # Handle table rows (if they appear outside of table)
    elif tag_name == 'tr':
        cells = []
        for cell in element.find_all(['td', 'th'], recursive=False):
            # Parse the cell content recursively
            cell_content = structure_json_html(str(cell))
            cells.append({
                "type": "table-cell",
                "content": cell_content
            })
        return {
            "type": "table-row",
            "items": cells
        }
    
    # Handle table headers
    elif tag_name == 'th':
        return {
            "type": "table-header",
            "text": element.get_text().strip()
        }
    
    # Handle table cells
    elif tag_name == 'td':
        return {
            "type": "table-cell",
            "text": element.get_text().strip()
        }
    
    # For other elements, return as generic text
    else:
        return {
            "type": "text",
            "text": element.get_text().strip()
        }

def structure_json_html(obj):
    if isinstance(obj, dict):
        return {k: structure_json_html(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [structure_json_html(item) for item in obj]
    elif isinstance(obj, str):
        # Parse HTML with BeautifulSoup and extract individual nodes as structured objects
        soup = BeautifulSoup(obj, 'html.parser')
        
        # If no HTML tags found, return the original string as a single text element
        if not soup.find():
            return [{"type": "text", "text": obj}]
        
        # Extract all HTML elements and parse them
        parsed_elements = []
        for element in soup.find_all():
            parsed_element = parse_html_element(element)
            # Only add non-empty elements (has text, items, rows, or content)
            has_text = parsed_element.get("text", "").strip()
            has_items = parsed_element.get("items", [])
            has_rows = parsed_element.get("rows", [])
            has_content = parsed_element.get("content", [])
            if has_text or has_items or has_rows or has_content:
                parsed_elements.append(parsed_element)
        
        # If no elements found but there's text content, include it
        if not parsed_elements and soup.get_text().strip():
            parsed_elements.append({"type": "text", "text": soup.get_text().strip()})
        
        return parsed_elements if parsed_elements else [{"type": "text", "text": obj}]
    else:
        return json.dumps(obj) 