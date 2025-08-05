#!/usr/bin/env python3

import asyncio
import sys
import os
import json
from dotenv import load_dotenv
from scripts.clean_json_html import clean_json_html
from scripts.enhance_content import enhance_content
from scripts.extract_tags import extract_condition_tags, extract_substance_tags, extract_indication_tags, \
    extract_strengths_and_concentrations_tags, extract_population_tags, extract_contraindications_tags
from scripts.structure_json_html import structure_json_html
from scripts.prepare_item_for_vector_search import prepare_item_for_vector_search
from scripts.summarize_description import summarize_meta_description, summarize_use_and_conditions, \
    summarize_contra_indications, summarize_dosing, summarize_warnings, summarize_description
from scripts.upsert_to_chromadb import upsert_q_items_to_chromadb
from scripts.upsert_items_to_postgres import upsert_items_to_postgres
from scripts.fix_html_syntax import fix_html_syntax
from scripts.find_similar_drugs_by_name import find_similar_drugs_by_name
from scripts.update_vector_similar_ranking import update_vector_similar_ranking
from scripts.upsert_items_to_elasticsearch import upsert_items_to_elasticsearch

# Load environment variables from .env file in the parent directory (project root)
load_dotenv('../.env')

# Add the root directory to the path so we can import from activities and services
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)


async def process_single_item(item):
    """
    Process a single item from the JSON array.
    This function handles all the async operations for one item.
    """
    print(f'Processing {item["drugName"]}...')

    # Clean and fix the item
    item = clean_json_html(item)
    item = fix_html_syntax(item)

    # Run all enhance_content calls in parallel
    description, indications_and_usage, dosage_and_administration, dosage_forms_and_strengths, contraindications, warnings_and_precautions, adverse_reactions = await asyncio.gather(
        enhance_content(item['label']['description']),
        enhance_content(item['label']['indicationsAndUsage']),
        enhance_content(item['label']['dosageAndAdministration']),
        enhance_content(item['label']['dosageFormsAndStrengths']),
        enhance_content(item['label']['contraindications']),
        enhance_content(item['label']['warningsAndPrecautions']),
        enhance_content(item['label']['adverseReactions'])
    )

    item['label']['description'] = description
    item['label']['indicationsAndUsage'] = indications_and_usage
    item['label']['dosageAndAdministration'] = dosage_and_administration
    item['label']['dosageFormsAndStrengths'] = dosage_forms_and_strengths
    item['label']['contraindications'] = contraindications
    item['label']['warningsAndPrecautions'] = warnings_and_precautions
    item['label']['adverseReactions'] = adverse_reactions

    # structured_item = structure_json_html(item)
    q_item = prepare_item_for_vector_search(item)

    # Run all summarize functions in parallel
    summary, description, use_and_conditions, contra_indications_warnings, warnings, dosing, tags_condition, tags_substance, tags_indication, tags_strengths_concentrations, tags_population = await asyncio.gather(
        summarize_meta_description(q_item),
        summarize_description(q_item),
        summarize_use_and_conditions(q_item),
        summarize_contra_indications(q_item),
        summarize_warnings(q_item),
        summarize_dosing(q_item),
        extract_condition_tags(q_item),
        extract_substance_tags(q_item),
        extract_indication_tags(q_item),
        extract_strengths_and_concentrations_tags(q_item),
        extract_population_tags(q_item),
    )

    q_item['metaDescription'] = summary
    item['label']['metaDescription'] = summary

    q_item['description'] = description
    item['label']['description'] = description

    q_item['useAndConditions'] = use_and_conditions
    item['label']['useAndConditions'] = use_and_conditions

    q_item['contraIndications'] = contra_indications_warnings
    item['label']['contraIndications'] = contra_indications_warnings

    q_item['warnings'] = warnings
    item['label']['warnings'] = warnings

    q_item['dosing'] = dosing
    item['label']['dosing'] = dosing

    q_item['tags_condition'] = tags_condition
    q_item['tags_substance'] = tags_substance
    q_item['tags_indications'] = tags_indication
    q_item['tags_strengths_concentrations'] = tags_strengths_concentrations
    q_item['tags_population'] = tags_population
    # q_item['tags_contraindications'] = tags_contraindications

    # Create view_blocks as a simple dictionary like q_item
    view_blocks = {
        'metaDescription': summary,
        'description': description,
        'useAndConditions': use_and_conditions,
        'contraIndications': contra_indications_warnings,
        'warnings': warnings,
        'dosing': dosing
    }

    view_blocks = structure_json_html(view_blocks)

    print(f'Completed {item["drugName"]}.')

    return item, q_item, view_blocks


async def main():
    print("Testing process_unstructured_drug_information function...")

    items = []
    structured_items_json_array = []
    q_items = []
    all_view_blocks = []

    with open("./data/Labels.json", "r", encoding="utf-8") as f:
        json_array = json.load(f)

        # Filter items if needed (uncomment the line below if you want to process only specific items)
        # json_array = [item for item in json_array if item['drugName'] in 'Ebglyss']

        # Process all items in parallel
        print(f"Processing {len(json_array)} items in parallel...")
        results = await asyncio.gather(*[process_single_item(item) for item in json_array])

        # Collect results
        for item, q_item, view_blocks in results:
            items.append(item)
            structured_items_json_array.append(item)
            q_items.append(q_item)
            all_view_blocks.append(view_blocks)

    with open("./data/items.json", "w", encoding="utf-8") as outfile:
        json.dump(items, outfile, ensure_ascii=False, indent=2)

    # Save the array to a JSON file in the data folder
    with open("./data/structured_items.json", "w", encoding="utf-8") as outfile:
        json.dump(structured_items_json_array, outfile, ensure_ascii=False, indent=2)

    with open("./data/q_items.json", "w", encoding="utf-8") as outfile:
        json.dump(q_items, outfile, ensure_ascii=False, indent=2)

    upsert_items_to_elasticsearch(q_items)
    upsert_q_items_to_chromadb(q_items)
    upsert_items_to_postgres(q_items, structured_items_json_array, all_view_blocks)

    for q_item in q_items:
        similar_items = find_similar_drugs_by_name(q_item['drugName'])
        update_vector_similar_ranking(q_item['setId'], similar_items)
        print(f'{q_item["drugName"]} has {len(similar_items)} similar items: {similar_items}')

    print("Function executed successfully!")


if __name__ == "__main__":
    asyncio.run(main())
