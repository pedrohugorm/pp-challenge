import os
import chromadb
from chromadb.config import Settings

def upsert_q_items_to_chromadb(q_items: list[dict], collection_name: str = "drug_data"):
    """
    Upsert q_items to ChromaDB with embeddings for each field separately.
    
    Args:
        q_items: List of processed items to upsert
        collection_name: Name of the ChromaDB collection
    """
    
    # Initialize ChromaDB client
    client = chromadb.Client(Settings(
        chroma_server_host=os.getenv("CHROMA_HOST", "localhost"),
        chroma_server_http_port=int(os.getenv("CHROMA_PORT", "8000")),
        chroma_server_ssl_enabled=False
    ))
    
    # Get or create collection
    try:
        collection = client.get_collection(name=collection_name)
        print(f"Using existing collection: {collection_name}")
    except:
        collection = client.create_collection(name=collection_name)
        print(f"Created new collection: {collection_name}")
    
    # Prepare data for ChromaDB
    ids = []
    documents = []
    metadatas = []
    
    for item in q_items:
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

        # Prepare metadata
        metadata = {
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
        
        ids.append(str(item['setId']))
        documents.append(concatenated_text)
        metadatas.append(metadata)
    
    # Upsert to ChromaDB
    collection.upsert(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )
    
    print(f"Successfully upserted {len(q_items)} items to ChromaDB collection: {collection_name}") 