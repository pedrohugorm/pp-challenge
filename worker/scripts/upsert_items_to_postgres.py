import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env')

def upsert_items_to_postgres(q_items, structured_items_json_array):
    """
    Upsert items to PostgreSQL database.
    
    Args:
        q_items: List of items prepared for Qdrant/vector database
        structured_items_json_array: List of structured JSON items
    """
    # PostgreSQL connection parameters with default values
    db_params = {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'database': os.getenv('POSTGRES_DB', 'drugs_db'),
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD', 'postgres')
    }
    
    # Create PostgreSQL connection
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Start transaction
        conn.autocommit = False
        
        # Extract unique labelers from structured_items_json_array
        unique_labelers = set()
        for structured_item in structured_items_json_array:
            labeler_name = structured_item.get('labeler', 'Unknown')
            unique_labelers.add(labeler_name)

        print(f'Unique labelers: {unique_labelers}')
        
        # Upsert unique labelers to the labelers table
        labeler_upsert_query = """
            INSERT INTO labelers (name, created_at, updated_at) 
            VALUES (%s, NOW(), NOW())
            ON CONFLICT DO NOTHING;
        """
        
        for labeler_name in unique_labelers:
            cursor.execute(labeler_upsert_query, (labeler_name,))
        
        print(f"Successfully upserted {len(unique_labelers)} unique labelers")
        
        # Process each item using indexes to access both arrays
        for i in range(len(structured_items_json_array)):
            structured_item = structured_items_json_array[i]
            q_item = q_items[i]

            print(f'Upserting {structured_item["drugName"]}...')
            
            # Extract labeler information (assuming it's in the structured item)
            labeler_name = structured_item.get('labeler', 'Unknown')
            
            # Get the labeler ID from the labelers table based on name
            labeler_query = "SELECT id FROM labelers WHERE name = %s"
            cursor.execute(labeler_query, (labeler_name,))
            labeler_result = cursor.fetchone()
            
            labeler_id = labeler_result['id']
            
            # Prepare drug data using q_items for most fields
            drug_id = q_item.get('setId')
            drug_name = q_item.get('drugName', '')
            generic_name = q_item['label'].get('genericName', '')
            product_type = q_item['label'].get('productType', '')
            effective_time_raw = q_item['label'].get('effectiveTime', '')
            # Ensure the format is 9999-99-99 (YYYY-MM-DD)
            if effective_time_raw and len(effective_time_raw) == 8 and effective_time_raw.isdigit():
                effective_time = f"{effective_time_raw[:4]}-{effective_time_raw[4:6]}-{effective_time_raw[6:8]}"
            else:
                effective_time = ''
            title = q_item['label'].get('title')
            slug = q_item.get('slug')

            # Extract various sections from q_items
            indications_and_usage = q_item['label'].get('indicationsAndUsage', None)
            dosage_and_administration = q_item['label'].get('dosageAndAdministration', None)
            dosage_forms_and_strengths = q_item['label'].get('dosageFormsAndStrengths', None)
            warnings_and_precautions = q_item['label'].get('warningsAndPrecautions', None)
            adverse_reactions = q_item['label'].get('adverseReactions', None)
            clinical_pharmacology = q_item['label'].get('clinicalPharmacology', None)
            clinical_studies = q_item['label'].get('clinicalStudies', None)
            how_supplied = q_item['label'].get('howSupplied', None)
            use_in_specific_populations = q_item['label'].get('useInSpecificPopulations', None)
            description = q_item['label'].get('description', None)
            nonclinical_toxicology = q_item['label'].get('nonclinicalToxicology', None)
            instructions_for_use = q_item['label'].get('instructionsForUse', None)
            mechanism_of_action = q_item['label'].get('mechanismOfAction', None)
            contraindications = q_item['label'].get('contraindications', None)
            boxed_warning = q_item['label'].get('boxedWarning', None)
            meta_description = q_item.get('metaDescription', None)

            # Use structured_item for highlights and blocks_json
            highlights = json.dumps(structured_item['label'].get('highlights', '{}'))
            blocks_json = json.dumps(structured_item.get('label', {}))

            # Insert drug record
            drug_insert_query = """
                INSERT INTO drugs (
                    id, name, generic_name, product_type, effective_time, title, slug,
                    labeler_id, indications_and_usage, dosage_and_administration,
                    dosage_forms_and_strengths, warnings_and_precautions, adverse_reactions,
                    clinical_pharmacology, clinical_studies, how_supplied,
                    use_in_specific_populations, description, nonclinical_toxicology,
                    instructions_for_use, mechanism_of_action, contraindications,
                    boxed_warning, meta_description, highlights, blocks_json, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                ) ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    generic_name = EXCLUDED.generic_name,
                    product_type = EXCLUDED.product_type,
                    effective_time = EXCLUDED.effective_time,
                    title = EXCLUDED.title,
                    slug = EXCLUDED.slug,
                    labeler_id = EXCLUDED.labeler_id,
                    indications_and_usage = EXCLUDED.indications_and_usage,
                    dosage_and_administration = EXCLUDED.dosage_and_administration,
                    dosage_forms_and_strengths = EXCLUDED.dosage_forms_and_strengths,
                    warnings_and_precautions = EXCLUDED.warnings_and_precautions,
                    adverse_reactions = EXCLUDED.adverse_reactions,
                    clinical_pharmacology = EXCLUDED.clinical_pharmacology,
                    clinical_studies = EXCLUDED.clinical_studies,
                    how_supplied = EXCLUDED.how_supplied,
                    use_in_specific_populations = EXCLUDED.use_in_specific_populations,
                    description = EXCLUDED.description,
                    nonclinical_toxicology = EXCLUDED.nonclinical_toxicology,
                    instructions_for_use = EXCLUDED.instructions_for_use,
                    mechanism_of_action = EXCLUDED.mechanism_of_action,
                    contraindications = EXCLUDED.contraindications,
                    boxed_warning = EXCLUDED.boxed_warning,
                    meta_description = EXCLUDED.meta_description,
                    highlights = EXCLUDED.highlights,
                    blocks_json = EXCLUDED.blocks_json,
                    updated_at = NOW();
            """

            cursor.execute(
                drug_insert_query,
                (
                    drug_id,
                    drug_name,
                    generic_name,
                    product_type,
                    effective_time,
                    title,
                    slug,
                    labeler_id,
                    indications_and_usage,
                    dosage_and_administration,
                    dosage_forms_and_strengths,
                    warnings_and_precautions,
                    adverse_reactions,
                    clinical_pharmacology,
                    clinical_studies,
                    how_supplied,
                    use_in_specific_populations,
                    description,
                    nonclinical_toxicology,
                    instructions_for_use,
                    mechanism_of_action,
                    contraindications,
                    boxed_warning,
                    meta_description,
                    highlights,
                    blocks_json
                )
            )

        # Commit the entire transaction
        conn.commit()
        print(f"Successfully inserted/updated {len(structured_items_json_array)} drug records")

    except psycopg2.Error as e:
        print(f"Error connecting to PostgreSQL: {e}")
        if conn:
            conn.rollback()
        return
    except Exception as e:
        print(f"Unexpected error: {e}")
        if conn:
            conn.rollback()
        return
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()