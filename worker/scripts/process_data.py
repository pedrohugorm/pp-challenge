#!/usr/bin/env python3

import asyncio
import sys
import os
import json
import re
from pydantic import BaseModel
from dotenv import load_dotenv
from bs4 import BeautifulSoup, NavigableString, Tag

# Load environment variables from .env file in the parent directory (project root)
load_dotenv('../.env')

# Add the root directory to the path so we can import from activities and services
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from activities.process_unstructured_drug_information import process_unstructured_drug_information
from labels_classes import DrugLabel

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
    
    try:
        # Parse HTML with BeautifulSoup - handles malformed HTML gracefully
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
        
    except Exception as e:
        # Fallback to regex method if BeautifulSoup fails
        print(f"Warning: BeautifulSoup parsing failed, falling back to regex: {e}")
        clean = re.compile('<.*?>')
        return re.sub(clean, '\n', text)

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

async def main():
    print("Testing process_unstructured_drug_information function...")
    
    results = []

    with open("./Labels.json", "r", encoding="utf-8") as f:
        json_array = json.load(f)
        for item in json_array:
            item = clean_json_html(item)

            try:
                # Automatic deserialization - Pydantic handles everything!
                drug_label = DrugLabel(**item)
                print(f"Successfully deserialized: {drug_label.drugName}")
                
                # Access nested label properties
                if drug_label.label:
                    print(f"  Generic Name: {drug_label.label.genericName}")
                    print(f"  Labeler Name: {drug_label.label.labelerName}")
                    print(f"  Title: {drug_label.label.title}")
                
                results.append(drug_label)
                
            except Exception as e:
                print(f"Error occurred: {e}")
                import traceback
                traceback.print_exc()

    print(f"Successfully processed {len(results)} drug labels")

    # Convert list of DrugLabel objects to list of dicts
    serializable_results = [r.model_dump() if isinstance(r, BaseModel) else r for r in results]

    with open("processed_labels.json", "w", encoding="utf-8") as outfile:
        json.dump(serializable_results, outfile, ensure_ascii=False, indent=2)

    print(f"Serialized {len(results)} drug labels to processed_labels.json")

if __name__ == "__main__":
    asyncio.run(main()) 