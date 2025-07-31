#!/usr/bin/env python3

import asyncio
import sys
import os
import json
from dotenv import load_dotenv

# Load environment variables from .env file in the parent directory (project root)
load_dotenv('../.env')

# Add the root directory to the path so we can import from activities and services
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from activities.process_unstructured_drug_information import process_unstructured_drug_information

async def main():
    print("Testing process_unstructured_drug_information function...")
    
    results = []

    with open("./Labels.json", "r", encoding="utf-8") as f:
        json_array = json.load(f)
        for item in json_array:
            try:
                unstructured_data = json.dumps(item)
                result = await process_unstructured_drug_information(unstructured_data)

                results.append(result)
                with open("processed.json", "w", encoding="utf-8") as pf:
                    json_serializable_results = [r.model_dump() for r in results]
                    json.dump(json_serializable_results, pf, ensure_ascii=False, indent=2)
                
                print("Function executed successfully!")
                print(f"Result type: {type(result)}")
                print(f"Result: {result}")
                
            except Exception as e:
                print(f"Error occurred: {e}")
                import traceback
                traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main()) 