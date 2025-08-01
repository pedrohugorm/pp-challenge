import json
import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

def upsert_q_items_to_qdrant(q_items, collection_name: str = "drug_data"):
    """
    Upsert q_items to Qdrant with embeddings for each field separately.
    
    Args:
        q_items: List of processed items to upsert
        collection_name: Name of the Qdrant collection
    """
    
    # Initialize Qdrant client
    client = QdrantClient(
        url=os.getenv("QDRANT_URL", "http://localhost:6333"),
        api_key=os.getenv("QDRANT_API_KEY")
    )
    
    # Initialize embedding model
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    vector_size = 384
    
    # Create collection if it doesn't exist
    try:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
        )
    except:
        print(f"Collection {collection_name} already exists")
        pass  # Collection already exists
    
    # Create points for Qdrant - field by field
    points = []
    for i, item in enumerate(q_items):
        
        # item['label']['indicationsAndUsage'] = embedding_model.encode(item['label']['indicationsAndUsage'].strip())
        # item['label']['dosageAndAdministration'] = embedding_model.encode(item['label']['dosageAndAdministration'].strip())
        # item['label']['dosageFormsAndStrengths'] = embedding_model.encode(item['label']['dosageFormsAndStrengths'].strip())
        # item['label']['warningsAndPrecautions'] = embedding_model.encode(item['label']['warningsAndPrecautions'].strip())
        # item['label']['adverseReactions'] = embedding_model.encode(item['label']['adverseReactions'].strip())
        # item['label']['clinicalPharmacology'] = embedding_model.encode(item['label']['clinicalPharmacology'].strip())
        # item['label']['clinicalStudies'] = embedding_model.encode(item['label']['clinicalStudies'].strip())
        # item['label']['howSupplied'] = embedding_model.encode(item['label']['howSupplied'].strip())
        # item['label']['useInSpecificPopulations'] = embedding_model.encode(item['label']['useInSpecificPopulations'].strip())
        # item['label']['description'] = embedding_model.encode(item['label']['description'].strip())
        # item['label']['nonclinicalToxicology'] = embedding_model.encode(item['label']['nonclinicalToxicology'].strip())
        # item['label']['nonclinicainstructionsForUselToxicology'] = embedding_model.encode(item['label']['instructionsForUse'].strip())
        # item['label']['mechanismOfAction'] = embedding_model.encode(item['label']['mechanismOfAction'].strip())
        # item['label']['contraindications'] = embedding_model.encode(item['label']['contraindications'].strip())
        # item['label']['boxedWarning'] = embedding_model.encode(item['label']['boxedWarning'].strip())
        # item['label']['highlights']['dosageAndAdministration'] = embedding_model.encode(item['label']['highlights']['dosageAndAdministration'].strip())

        point = PointStruct(
            id=item['setId'],
            vector={},
            payload={
                "item_id": i,
                "indicationsAndUsage": item['label']['indicationsAndUsage'],
                "dosageAndAdministration": item['label']['dosageAndAdministration'],
                "dosageFormsAndStrengths": item['label']['dosageFormsAndStrengths'],
                "warningsAndPrecautions": item['label']['warningsAndPrecautions'],
                "adverseReactions": item['label']['adverseReactions'],
                "clinicalPharmacology": item['label']['clinicalPharmacology'],
                "clinicalStudies": item['label']['clinicalStudies'],
                "howSupplied": item['label']['howSupplied'],
                "useInSpecificPopulations": item['label']['useInSpecificPopulations'],
                "description": item['label']['description'],
                "nonclinicalToxicology": item['label']['nonclinicalToxicology'],
                "nonclinicainstructionsForUselToxicology": item['label']['instructionsForUse'],
                "mechanismOfAction": item['label']['mechanismOfAction'],
                "contraindications": item['label']['contraindications'],
                "boxedWarning": item['label']['boxedWarning'],
                "item": item
            }
        )
        points.append(point)
    
    # Upsert to Qdrant
    client.upsert(collection_name=collection_name, points=points) 