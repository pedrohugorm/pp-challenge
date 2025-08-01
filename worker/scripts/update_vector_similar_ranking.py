import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env')

def update_vector_similar_ranking(medication_id: str, similar_items: list):
    """
    Update the vector_similar_ranking field for a specific medication.
    
    Args:
        medication_id: The ID of the medication to update
        similar_items: List of tuples containing (drug_name, similarity_score)
    """
    # Convert similar_items from list of tuples to dict[str, int]
    similar_items_dict = {}
    for slug, similarity_score in similar_items:
        similar_items_dict[slug] = int(similarity_score)
    
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
        
        # Update the vector_similar_ranking field
        update_query = """
            UPDATE drugs 
            SET vector_similar_ranking = %s, updated_at = NOW()
            WHERE id = %s;
        """
        
        # Convert dict to JSON string
        similar_items_json = json.dumps(similar_items_dict)
        
        cursor.execute(update_query, (similar_items_json, medication_id))
        
        # Check if any rows were affected
        if cursor.rowcount == 0:
            print(f"No medication found with ID: {medication_id}")
            return False
        
        # Commit the transaction
        conn.commit()
        print(f"Successfully updated vector_similar_ranking for medication ID: {medication_id}")
        print(f"Similar items count: {len(similar_items_dict)}")
        return True

    except psycopg2.Error as e:
        print(f"Error connecting to PostgreSQL: {e}")
        if conn:
            conn.rollback()
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close() 