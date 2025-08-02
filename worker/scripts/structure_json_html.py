from bs4 import BeautifulSoup, NavigableString, Comment, Tag

def parse_element_to_dict(element):
    """
    Recursively parses a Beautiful Soup element and its children
    into a Python dictionary structure.
    """
    if isinstance(element, NavigableString):
        # Ignore comments and empty strings
        if not isinstance(element, Comment) and element.strip():
            return element.strip()
        else:
            return None
    
    if element.name is None:  # This might happen for the BeautifulSoup object itself
        parsed_children = []
        for child in element.children:
            parsed_child = parse_element_to_dict(child)
            if parsed_child is not None:
                parsed_children.append(parsed_child)
        return parsed_children

    result = {
        "type": element.name,
        "contents": []
    }

    # Process all children
    for child in element.children:
        parsed_child = parse_element_to_dict(child)
        if parsed_child is not None:
            if isinstance(parsed_child, list):
                # If the child returned a list, extend our contents
                result["contents"].extend(parsed_child)
            else:
                # Otherwise append the child
                result["contents"].append(parsed_child)

    return result

def structure_json_html(obj):
    """
    Recursively processes a JSON dictionary and calls parse_element_to_dict
    for each value, replacing it with the result.
    """
    if not isinstance(obj, dict):
        return obj
    
    result = {}
    
    for key, value in obj.items():
        # Skip processing for specific fields - keep them unchanged
        if key in ["drugName", "setId", "slug", "labeler", ]:
            result[key] = value
            continue
            
        # Skip processing for fields inside label object
        if key in ["genericName", "labelerName", "productType", "effectiveTime", "title"] and isinstance(value, str):
            result[key] = value
            continue
            
        if isinstance(value, dict):
            # Recursively process nested dictionaries
            result[key] = structure_json_html(value)
        elif isinstance(value, list):
            # Process each item in the list
            processed_list = []
            for item in value:
                if isinstance(item, dict):
                    processed_list.append(structure_json_html(item))
                elif isinstance(item, str):
                    # Try to parse string items as HTML
                    try:
                        soup = BeautifulSoup(item, 'html.parser')
                        parsed_item = parse_element_to_dict(soup)
                        processed_list.append(parsed_item)
                    except (AttributeError, TypeError):
                        processed_list.append(item)
                else:
                    processed_list.append(item)
            result[key] = processed_list
        elif isinstance(value, str):
            # If the value is a string, try to parse it as HTML
            try:
                # Parse the string as HTML using BeautifulSoup
                soup = BeautifulSoup(value, 'html.parser')
                parsed_value = parse_element_to_dict(soup)
                result[key] = [parsed_value]
            except (AttributeError, TypeError):
                # If parsing fails, keep the original string value
                result[key] = [value]
        else:
            # For other types (numbers, booleans, etc.), keep as is
            result[key] = value
    
    return result
