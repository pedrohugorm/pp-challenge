#!/usr/bin/env python3

import asyncio
import sys
import os
import json
from pydantic import BaseModel
from dotenv import load_dotenv
from scripts.clean_json_html import clean_json_html
from scripts.structure_json_html import structure_json_html

# Load environment variables from .env file in the parent directory (project root)
load_dotenv('../.env')

# Add the root directory to the path so we can import from activities and services
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

async def main():
    print("Testing process_unstructured_drug_information function...")
    
    results = []
    structured_items_json_array = []

    with open("./data/Labels.json", "r", encoding="utf-8") as f:
        json_array = json.load(f)
        for item in json_array:
            item = clean_json_html(item)

            structured_item = structure_json_html(item)
            # structured_item_json = json.dumps(structured_item, ensure_ascii=False, indent=2)

            structured_items_json_array.append(structured_item)

    # Save the array to a JSON file in the data folder
    with open("./data/structured_items.json", "w", encoding="utf-8") as outfile:
        json.dump(structured_items_json_array, outfile, ensure_ascii=False, indent=2)

    print(f"Successfully processed {len(results)} drug labels")

    print(f"Serialized {len(results)} drug labels to processed_labels.json")

if __name__ == "__main__":
    asyncio.run(main()) 