#!/usr/bin/env python3

import re
import json
from bs4 import BeautifulSoup, NavigableString, Tag

def is_effectively_empty(tag: Tag) -> bool:
    # Check if a tag is empty or only contains whitespace or other empty tags
    if not tag.contents:
        return True
    for child in tag.contents:
        if isinstance(child, NavigableString) and child.strip():
            return False
        if isinstance(child, Tag) and not is_effectively_empty(child):
            return False
    return True

def traverse_and_clean(node):
    unwrap_tags = ['section', 'article', 'aside', 'div', 'span']

    if isinstance(node, Tag):
        # Recurse first to clean children before evaluating the current tag
        for child in list(node.children):
            traverse_and_clean(child)

        # Remove attributes
        node.attrs.clear()

        # Replace <a> with text
        if node.name == "a":
            node.replace_with(node.get_text())
            return

        # Unwrap tags that should be "popped out" if they have content
        if node.name in unwrap_tags and node.contents:
            node.unwrap()
            return  # No need to check for emptiness after unwrapping

        # Remove empty tags
        if is_effectively_empty(node):
            node.decompose()

def remove_html_tags(text):
    """Remove HTML tags from a string, keeping only the inner text.
    Uses BeautifulSoup to handle malformed HTML gracefully."""
    if not isinstance(text, str):
        return text
    
    soup = BeautifulSoup(text, 'html.parser')
        
    # Get all text content, preserving some structure with newlines
    # Remove script and style elements as they don't contain meaningful text
    for script in soup(["script", "style"]):
        script.decompose()
    
    traverse_and_clean(soup)

    text_content = str(soup)
    
    # Clean up excessive whitespace and newlines
    text_content = re.sub(r'\n\s*\n', '\n', text_content)  # Remove multiple consecutive newlines
    text_content = re.sub(r'[ \t]+', ' ', text_content)     # Normalize spaces
    text_content = text_content.strip()
    
    return text_content

def remove_unicode_characters(text):
    """Remove problematic unicode characters from a string, keeping only ASCII characters."""
    if not isinstance(text, str):
        return text
    # Remove unicode characters but keep basic punctuation and spaces
    # This keeps ASCII characters (0-127) and common punctuation
    cleaned = ''.join(char for char in text if ord(char) < 128)
    # Remove extra whitespace that might be left after cleaning
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def clean_json_html(obj):
    """
    Recursively remove HTML tags and unicode characters from all string properties in a JSON-like object.
    Returns the cleaned object in the same structure.
    """
    if isinstance(obj, dict):
        return {k: clean_json_html(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_json_html(item) for item in obj]
    elif isinstance(obj, str):
        # First remove HTML tags, then remove unicode characters
        cleaned = remove_unicode_characters(obj)
        cleaned = remove_html_tags(cleaned)
        return cleaned
    else:
        return json.dumps(obj) 