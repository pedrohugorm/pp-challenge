import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

def upsert_q_items_to_qdrant(q_items: list[dict], collection_name: str = "drug_data"):
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
    vector_size = 500
    
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
        
        # Concatenate relevant fields into one variable
        concatenated_text = " ".join([
            str(item['label'].get('indicationsAndUsage', '')).strip(),
            str(item['label'].get('dosageAndAdministration', '')).strip(),
            str(item['label'].get('dosageFormsAndStrengths', '')).strip(),
            str(item['label'].get('warningsAndPrecautions', '')).strip(),
            str(item['label'].get('adverseReactions', '')).strip(),
            str(item['label'].get('clinicalPharmacology', '')).strip(),
            str(item['label'].get('clinicalStudies', '')).strip(),
            str(item['label'].get('howSupplied', '')).strip(),
            str(item['label'].get('useInSpecificPopulations', '')).strip(),
            str(item['label'].get('description', '')).strip(),
            str(item['label'].get('nonclinicalToxicology', '')).strip(),
            str(item['label'].get('instructionsForUse', '')).strip(),
            str(item['label'].get('mechanismOfAction', '')).strip(),
            str(item['label'].get('contraindications', '')).strip(),
            str(item['label'].get('boxedWarning', '')).strip(),
            str(item['label'].get('highlights', {}).get('dosageAndAdministration', '')).strip()
        ])

        embedding = embedding_model.encode(concatenated_text).tolist()

        point = PointStruct(
            id=item['setId'],
            vector=embedding,
            payload={
                "item_id": item.get('setId'),
                "indicationsAndUsage": item['label'].get('indicationsAndUsage', None),
                "dosageAndAdministration": item['label'].get('dosageAndAdministration', None),
                "dosageFormsAndStrengths": item['label'].get('dosageFormsAndStrengths', None),
                "warningsAndPrecautions": item['label'].get('warningsAndPrecautions', None),
                "adverseReactions": item['label'].get('adverseReactions', None),
                "clinicalPharmacology": item['label'].get('clinicalPharmacology', None),
                "clinicalStudies": item['label'].get('clinicalStudies', None),
                "howSupplied": item['label'].get('howSupplied', None),
                "useInSpecificPopulations": item['label'].get('useInSpecificPopulations', None),
                "description": item['label'].get('description', None),
                "nonclinicalToxicology": item['label'].get('nonclinicalToxicology', None),
                "instructionsForUse": item['label'].get('instructionsForUse', None),
                "mechanismOfAction": item['label'].get('mechanismOfAction', None),
                "contraindications": item['label'].get('contraindications', None),
                "boxedWarning": item['label'].get('boxedWarning', None)
            }
        )
        points.append(point)
    
    # Upsert to Qdrant
    client.upsert(collection_name=collection_name, points=points) 