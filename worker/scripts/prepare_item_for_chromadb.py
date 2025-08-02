import json
from bs4 import BeautifulSoup

def prepare_item_for_chromadb(obj):
    """
    Recursively processes a JSON object, removing HTML tags from string values
    and adding line breaks after each tag's text content.
    
    Args:
        obj: A JSON object that may contain HTML strings
        
    Returns:
        The processed object with HTML tags removed and line breaks added
    """
    if isinstance(obj, dict):
        return {k: prepare_item_for_chromadb(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [prepare_item_for_chromadb(item) for item in obj]
    elif isinstance(obj, str):
        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(obj, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # If no HTML tags found, return the original string
        if not soup.find():
            return obj
        
        def extract_text_with_line_breaks(element):
            """Extract text from HTML element, adding line breaks after each tag"""
            result = ""
            
            for child in element.children:
                if hasattr(child, 'name') and child.name:
                    # It's a tag, get its text content
                    tag_text = child.get_text().strip()
                    if tag_text:
                        result += tag_text + "\n"
                    # Recursively process children
                    child_text = extract_text_with_line_breaks(child)
                    if child_text:
                        result += child_text
                elif str(child).strip():
                    # It's text content
                    text = str(child).strip()
                    if text:
                        result += text + "\n"
            
            return result
        
        # Extract text with line breaks
        processed_text = extract_text_with_line_breaks(soup)
        
        # Clean up extra line breaks and whitespace
        processed_text = "\n".join(line.strip() for line in processed_text.split("\n") if line.strip())
        
        return processed_text if processed_text else obj
    else:
        return json.dumps(obj) 