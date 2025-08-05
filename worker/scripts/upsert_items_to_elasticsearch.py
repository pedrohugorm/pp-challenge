#!/usr/bin/env python3

import os
from elasticsearch import Elasticsearch
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env')

def upsert_items_to_elasticsearch(q_items: list[dict], index_name: str = "drugs_db"):
    """
    Upsert items to Elasticsearch database.
    
    Args:
        q_items: List of items prepared for vector database (array of dictionaries)
        index_name: Name of the Elasticsearch index
    """
    # Elasticsearch connection parameters with default values
    es_host = os.getenv('ELASTICSEARCH_HOST', 'localhost')
    es_port = os.getenv('ELASTICSEARCH_PORT', '9200')
    es_url = os.getenv('ELASTICSEARCH_URL', f'http://{es_host}:{es_port}')
    
    print(f'Starting Elasticsearch pipeline {es_url}')
    
    # Create Elasticsearch client
    es = None
    try:
        es = Elasticsearch(
            hosts=[es_url],
            verify_certs=False,
            ssl_show_warn=False
        )
        
        # Check if Elasticsearch is running
        if not es.ping():
            print("Error: Could not connect to Elasticsearch")
            return
        
        print(f'Elasticsearch: {es.info()["cluster_name"]}')
        
        # Create index if it doesn't exist
        if not es.indices.exists(index=index_name):
            # Define mapping for the drugs index
            mapping = {
                "mappings": {
                    "properties": {
                        "setId": {"type": "keyword"},
                        "drugName": {"type": "text"},
                        "slug": {"type": "keyword"},
                        "genericName": {"type": "text"},
                        "productType": {"type": "keyword"},
                        "title": {"type": "text"},
                        "metaDescription": {"type": "text"},
                        "description": {"type": "text"},
                        "useAndConditions": {"type": "text"},
                        "contraIndications": {"type": "text"},
                        "warnings": {"type": "text"},
                        "dosing": {"type": "text"},
                        "indicationsAndUsage": {"type": "text"},
                        "dosageAndAdministration": {"type": "text"},
                        "dosageFormsAndStrengths": {"type": "text"},
                        "warningsAndPrecautions": {"type": "text"},
                        "adverseReactions": {"type": "text"},
                        "clinicalPharmacology": {"type": "text"},
                        "clinicalStudies": {"type": "text"},
                        "howSupplied": {"type": "text"},
                        "useInSpecificPopulations": {"type": "text"},
                        "nonclinicalToxicology": {"type": "text"},
                        "instructionsForUse": {"type": "text"},
                        "mechanismOfAction": {"type": "text"},
                        "contraindications": {"type": "text"},
                        "boxedWarning": {"type": "text"},
                        "ai_warnings": {"type": "text"},
                        "ai_dosing": {"type": "text"},
                        "ai_use_and_conditions": {"type": "text"},
                        "ai_contraindications": {"type": "text"},
                        "ai_description": {"type": "text"},
                        "tags_condition": {"type": "keyword"},
                        "tags_substance": {"type": "keyword"},
                        "tags_indications": {"type": "keyword"},
                        "tags_strengths_concentrations": {"type": "keyword"},
                        "tags_population": {"type": "keyword"},
                        "labeler": {"type": "keyword"},
                        "highlights": {"type": "object"}
                    }
                },
                "settings": {
                    "number_of_shards": 1,
                    "number_of_replicas": 0
                }
            }
            
            es.indices.create(index=index_name, body=mapping)
            print(f"Created index: {index_name}")
        else:
            print(f"Index already exists: {index_name}")
        
        # Helper function to safely get tags
        def get_safe_tags(tag_field):
            if tag_field is None:
                return []
            tags_data = tag_field.get('tags') if isinstance(tag_field, dict) else None
            return tags_data if tags_data is not None else []
        
        # Process each item
        total_items = 0
        for item in q_items:
            print(f'Upserting {item["drugName"]}...')
            
            # Prepare document for Elasticsearch
            doc = {
                "setId": item.get('setId'),
                "drugName": item.get('drugName', ''),
                "slug": item.get('slug'),
                "genericName": item['label'].get('genericName', ''),
                "productType": item['label'].get('productType', ''),
                "title": item['label'].get('title'),
                "metaDescription": item.get('metaDescription', ''),
                "description": item.get('description', ''),
                "useAndConditions": item.get('useAndConditions', ''),
                "contraIndications": item.get('contraIndications', ''),
                "warnings": item.get('warnings', ''),
                "dosing": item.get('dosing', ''),
                "indicationsAndUsage": item['label'].get('indicationsAndUsage', ''),
                "dosageAndAdministration": item['label'].get('dosageAndAdministration', ''),
                "dosageFormsAndStrengths": item['label'].get('dosageFormsAndStrengths', ''),
                "warningsAndPrecautions": item['label'].get('warningsAndPrecautions', ''),
                "adverseReactions": item['label'].get('adverseReactions', ''),
                "clinicalPharmacology": item['label'].get('clinicalPharmacology', ''),
                "clinicalStudies": item['label'].get('clinicalStudies', ''),
                "howSupplied": item['label'].get('howSupplied', ''),
                "useInSpecificPopulations": item['label'].get('useInSpecificPopulations', ''),
                "nonclinicalToxicology": item['label'].get('nonclinicalToxicology', ''),
                "instructionsForUse": item['label'].get('instructionsForUse', ''),
                "mechanismOfAction": item['label'].get('mechanismOfAction', ''),
                "contraindications": item['label'].get('contraindications', ''),
                "boxedWarning": item['label'].get('boxedWarning', ''),
                "ai_warnings": item.get('warnings', ''),
                "ai_dosing": item.get('dosing', ''),
                "ai_use_and_conditions": item.get('useAndConditions', ''),
                "ai_contraindications": item.get('contraIndications', ''),
                "ai_description": item.get('description', ''),
                "tags_condition": get_safe_tags(item.get('tags_condition')),
                "tags_substance": get_safe_tags(item.get('tags_substance')),
                "tags_indications": get_safe_tags(item.get('tags_indications')),
                "tags_strengths_concentrations": get_safe_tags(item.get('tags_strengths_concentrations')),
                "tags_population": get_safe_tags(item.get('tags_population')),
                "labeler": item.get('labeler', 'Unknown'),
                "highlights": item['label'].get('highlights', {})
            }
            
            # Use setId as document ID for upsert
            doc_id = item.get('setId')
            if doc_id:
                # Upsert document (insert if not exists, update if exists)
                es.index(
                    index=index_name,
                    id=doc_id,
                    body=doc,
                    op_type='index'  # This will create or update
                )
                total_items += 1
                print(f'Upserted {item["drugName"]} with ID: {doc_id}')
            else:
                print(f'Warning: No setId found for {item["drugName"]}, skipping...')
        
        # Refresh the index to make documents searchable immediately
        es.indices.refresh(index=index_name)
        print(f"Successfully upserted {total_items} items to Elasticsearch index: {index_name}")
        
    except Exception as e:
        print(f"Error connecting to Elasticsearch: {e}")
        return
    finally:
        if es:
            es.close() 