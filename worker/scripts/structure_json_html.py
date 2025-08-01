import json
from bs4 import BeautifulSoup

def structure_json_html(obj):
    if isinstance(obj, dict):
        return {k: structure_json_html(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [structure_json_html(item) for item in obj]
    elif isinstance(obj, str):
        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(obj, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # If no HTML tags found, return the original string
        if not soup.find():
            return obj
        
        def parse_element(element):
            """Recursively parse an HTML element and its children"""
            if hasattr(element, 'name') and element.name:
                # It's a tag
                children = []
                for child in element.children:
                    if hasattr(child, 'name') and child.name:
                        # Child is a tag, recurse
                        child_parsed = parse_element(child)
                        if child_parsed:
                            children.append(child_parsed)
                    elif str(child).strip():
                        # Child is text content
                        children.append(str(child).strip())
                
                return {
                    'type': element.name,
                    'contents': children if children else element.get_text().strip()
                }
            else:
                # It's text content
                text = str(element).strip()
                return text if text else None
        
        # Get all elements as a list with hierarchical structure
        elements = []
        for tag in soup.find_all():
            parsed_element = parse_element(tag)
            if parsed_element and parsed_element['contents']:
                elements.append(parsed_element)
        
        return elements if elements else obj
    else:
        return json.dumps(obj) 