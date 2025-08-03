import os
import chromadb
from tiktoken import get_encoding
from typing import List
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
import spacy

# Constants
MAX_TOKENS = 300  # Target chunk size
ENCODING = get_encoding("cl100k_base")  # same as GPT-4 and gpt-3.5-turbo
nlp = spacy.load("en_core_web_sm")

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

def spacy_chunk_text(text: str, max_tokens: int = 300, overlap_tokens: int = 30):
    doc = nlp(text)
    sentences = [sent.text.strip() for sent in doc.sents]

    chunks = []
    current_chunk = []
    current_tokens = 0

    for sentence in sentences:
        tokens = ENCODING.encode(sentence)
        token_count = len(tokens)

        if current_tokens + token_count <= max_tokens:
            current_chunk.append(sentence)
            current_tokens += token_count
        else:
            if current_chunk:
                chunks.append(" ".join(current_chunk))
            # Start new chunk with optional overlap
            if overlap_tokens > 0 and current_chunk:
                overlap = current_chunk[-1:]
                current_chunk = overlap + [sentence]
                current_tokens = len(ENCODING.encode(" ".join(current_chunk)))
            else:
                current_chunk = [sentence]
                current_tokens = token_count

    if current_chunk:
        chunks.append(" ".join(current_chunk))

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

    # Set up local embedding model
    embedding_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

    # Get or create collection with embedding support
    collection = client.get_or_create_collection(
        name=collection_name,
        embedding_function=embedding_fn
    )

    print(f"Collection ready: {collection_name}")
    
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
        # chunks = chunk_text(concatenated_text, MAX_TOKENS)
        chunks = spacy_chunk_text(concatenated_text, max_tokens=MAX_TOKENS, overlap_tokens=30)

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