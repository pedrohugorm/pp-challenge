#!/usr/bin/env python3

import asyncio
import sys
import os
import json
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file in the parent directory (project root)
load_dotenv('../.env')

# Add the root directory to the path so we can import from activities and services
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from activities.process_unstructured_drug_information import process_unstructured_drug_information
from labels_classes import DrugLabel
from data_cleanup import clean_json_html
from data_structure import structure_json_html

async def main():
    print("Testing process_unstructured_drug_information function...")
    
    results = []

    with open("./Labels.json", "r", encoding="utf-8") as f:
        json_array = json.load(f)
        for item in json_array:
            item = clean_json_html(item)

            structured_item = structure_json_html(item)
            structured_item_json = json.dumps(structured_item, ensure_ascii=False, indent=2)
            with open("structured_item.json", "w", encoding="utf-8") as struct_outfile:
                struct_outfile.write(structured_item_json)

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