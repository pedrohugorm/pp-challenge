import os
import chromadb
from tiktoken import get_encoding
from typing import List

# Constants
MAX_TOKENS = 300  # Target chunk size
ENCODING = get_encoding("cl100k_base")  # same as GPT-4 and gpt-3.5-turbo

def chunk_text(text: str, max_tokens: int) -> List[str]:
    """Split text into token-limited chunks."""
    tokens = ENCODING.encode(text)
    chunks = []
    start = 0
    while start < len(tokens):
        end = start + max_tokens
        chunk = ENCODING.decode(tokens[start:end])
        chunks.append(chunk)
        start = end
    return chunks

def upsert_q_items_to_chromadb(q_items: list[dict], collection_name: str = "drug_data"):
    """
    Upsert q_items to ChromaDB with embeddings for each field separately.
    
    Args:
        q_items: List of processed items to upsert
        collection_name: Name of the ChromaDB collection
    """

    # Initialize ChromaDB client
    chroma_host = os.getenv("CHROMA_HOST", "localhost")
    chroma_port = os.getenv("CHROMA_PORT", "8000")

    print(f'Starting Chroma DB pipeline {chroma_host}:{chroma_port}')

    client = chromadb.HttpClient(
        host=chroma_host,
        port=int(chroma_port),
        ssl=False
    )
    print(f'Chroma DB: {client.database}')
    print(f'Chroma Tenant: {client.tenant}')
    
    # Get or create collection (uses default all-MiniLM-L6-v2 embeddings)
    try:
        print(f'Collection List: {client.list_collections()}')
        collection = client.get_collection(name=collection_name)
        print(f"Using existing collection: {collection_name}")
    except Exception as e:
        # Check if the error is specifically about collection not found
        print(e)
        if "not found" in str(e).lower() or "does not exist" in str(e).lower():
            collection = client.create_collection(name=collection_name)
            print(f"Created new collection: {collection_name}")
        else:
            # Re-raise other exceptions (connection issues, auth problems, etc.)
            print(f"Error accessing ChromaDB: {e}")
            raise
    
    # Prepare data for ChromaDB
    total_chunks = 0
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
            str(item.get('useAndConditions', '')).strip(),
            str(item.get('contraIndications', '')).strip(),
            str(item.get('metaDescription', '')).strip(),
            str(item.get('dosing', '')).strip(),
            str(item.get('warnings', '')).strip(),
            str(item['label'].get('highlights', {}).get('dosageAndAdministration', '')).strip()
        ])

        # Prepare metadata
        metadata = {}
        if item.get('setId') is not None:
            metadata["item_id"] = item.get('setId')
            metadata['name'] = item.get('drugName')
            metadata['slug'] = item.get('slug')
        for key in [
            # "indicationsAndUsage",
            # "dosageAndAdministration",
            # "dosageFormsAndStrengths",
            # "warningsAndPrecautions",
            # "adverseReactions",
            # "clinicalPharmacology",
            # "clinicalStudies",
            # "howSupplied",
            # "useInSpecificPopulations",
            # "description",
            # "nonclinicalToxicology",
            # "instructionsForUse",
            # "mechanismOfAction",
            # "contraindications",
            # "boxedWarning"
        ]:
            value = item['label'].get(key, None)
            if value is not None:
                metadata[key] = value
        
        # Chunk the concatenated text
        chunks = chunk_text(concatenated_text, MAX_TOKENS)
        
        # Add each chunk with the same id and metadata
        for idx, chunk in enumerate(chunks):
            chunk_id = f"{item['setId']}:chunk:{idx}"
            ids.append(chunk_id)
            documents.append(chunk)
            metadatas.append(metadata)

        print(f'Upserting {len(ids)} items to ChromaDB')

        # Upsert to ChromaDB
        collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )

        total_chunks += len(ids)
        print(f'Upserted {len(ids)} chunks')
        ids = []
        documents = []
        metadatas = []
    
    print(f"Successfully upserted {total_chunks} chunks from {len(q_items)} items to ChromaDB collection: {collection_name}")