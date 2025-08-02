#!/usr/bin/env python3

import asyncio
import sys
import os
import json
from dotenv import load_dotenv
from scripts.clean_json_html import clean_json_html
from scripts.structure_json_html import structure_json_html
from scripts.prepare_item_for_qdrant import prepare_item_for_qdrant
from scripts.upsert_to_chromadb import upsert_q_items_to_chromadb
from scripts.upsert_items_to_postgres import upsert_items_to_postgres

# Load environment variables from .env file in the parent directory (project root)
load_dotenv('../.env')

# Add the root directory to the path so we can import from activities and services
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)


async def main():
    print("Testing process_unstructured_drug_information function...")

    structured_items_json_array = []
    q_items = []

    with open("./data/Labels.json", "r", encoding="utf-8") as f:
        json_array = json.load(f)
        for item in json_array:
            item = clean_json_html(item)

            structured_item = structure_json_html(item)
            q_item = prepare_item_for_qdrant(item)

            structured_items_json_array.append(structured_item)
            q_items.append(q_item)

    # Save the array to a JSON file in the data folder
    with open("./data/structured_items.json", "w", encoding="utf-8") as outfile:
        json.dump(structured_items_json_array, outfile, ensure_ascii=False, indent=2)

    with open("./data/q_items.json", "w", encoding="utf-8") as outfile:
        json.dump(q_items, outfile, ensure_ascii=False, indent=2)

    upsert_q_items_to_chromadb(q_items)

    # upsert_items_to_postgres(q_items, structured_items_json_array)

    print("Function executed successfully!")


if __name__ == "__main__":
    asyncio.run(main())
