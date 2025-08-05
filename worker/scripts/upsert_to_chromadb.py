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

def upsert_q_items_to_chromadb(q_items: list[dict], collection_name: str = "drug_data", similar_collection_name: str = "drug_similar_data"):
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

    collection_similar = client.get_or_create_collection(
        name=similar_collection_name,
        embedding_function=embedding_fn
    )

    print(f"Collection ready: {collection_name}")
    
    # Prepare data for ChromaDB
    total_chunks = 0
    ids = []
    ids_similar = []
    documents = []
    documents_similar = []
    metadatas = []
    metadatas_similar = []
    
    for item in q_items:
        # Concatenate relevant fields into one variable
        # Add tag-based sentences to help with chunking and similarities
        tag_sentences = []
        drug_name = item.get('drugName', '')
        
        # Helper function to safely get tags
        def get_safe_tags(tag_field):
            if tag_field is None:
                return []
            tags_data = tag_field.get('tags') if isinstance(tag_field, dict) else None
            return tags_data if tags_data is not None else []
        
        # Indications tags
        indications_tags = get_safe_tags(item.get('tags_indications'))
        for tag in indications_tags:
            tag_sentences.append(f"{drug_name} is indicated for {tag}")
            tag_sentences.append(f"{drug_name} is prescribed for {tag}")
            tag_sentences.append(f"{drug_name} is used to treat {tag}")
            tag_sentences.append(f"{drug_name} is effective for {tag}")
            tag_sentences.append(f"{drug_name} is recommended for {tag}")
        
        # Conditions tags
        conditions_tags = get_safe_tags(item.get('tags_condition'))
        for tag in conditions_tags:
            tag_sentences.append(f"{drug_name} is used to treat {tag}")
            tag_sentences.append(f"{drug_name} is indicated for {tag}")
            tag_sentences.append(f"{drug_name} is prescribed for {tag}")
            tag_sentences.append(f"{drug_name} is effective against {tag}")
            tag_sentences.append(f"{drug_name} is recommended for {tag}")
            tag_sentences.append(f"{drug_name} helps manage {tag}")
        
        # Substances tags
        substances_tags = get_safe_tags(item.get('tags_substance'))
        for tag in substances_tags:
            tag_sentences.append(f"{drug_name} contains {tag}")
            tag_sentences.append(f"{drug_name} includes {tag}")
            tag_sentences.append(f"{drug_name} is composed of {tag}")
            tag_sentences.append(f"{drug_name} has {tag} as an ingredient")
            tag_sentences.append(f"{drug_name} contains the substance {tag}")
        
        # Strengths/Concentrations tags
        strengths_tags = get_safe_tags(item.get('tags_strengths_concentrations'))
        for tag in strengths_tags:
            tag_sentences.append(f"{drug_name} is available in {tag}")
            tag_sentences.append(f"{drug_name} comes in {tag}")
            tag_sentences.append(f"{drug_name} is offered in {tag}")
            tag_sentences.append(f"{drug_name} is manufactured in {tag}")
            tag_sentences.append(f"{drug_name} is available as {tag}")
            tag_sentences.append(f"{drug_name} has strength {tag}")
        
        # Populations tags
        populations_tags = get_safe_tags(item.get('tags_population'))
        for tag in populations_tags:
            tag_sentences.append(f"{drug_name} is used in {tag}")
            tag_sentences.append(f"{drug_name} is prescribed for {tag}")
            tag_sentences.append(f"{drug_name} is indicated for {tag}")
            tag_sentences.append(f"{drug_name} is suitable for {tag}")
            tag_sentences.append(f"{drug_name} is recommended for {tag}")
            tag_sentences.append(f"{drug_name} is approved for {tag}")
        
        # Contraindications tags
        # contraindications_tags = get_safe_tags(item.get('tags_contraindications'))
        # for tag in contraindications_tags:
        #     tag_sentences.append(f"{drug_name} is contraindicated in {tag}")
        #     tag_sentences.append(f"{drug_name} should not be used in {tag}")
        #     tag_sentences.append(f"{drug_name} is not recommended for {tag}")
        #     tag_sentences.append(f"{drug_name} is not suitable for {tag}")
        #     tag_sentences.append(f"{drug_name} should be avoided in {tag}")
        #     tag_sentences.append(f"{drug_name} is not indicated for {tag}")
        
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
            str(item['label'].get('highlights', {}).get('dosageAndAdministration', '')).strip(),
            " ".join(tag_sentences)
        ])

        

        similar_check_text = " ".join([
            str(item['label'].get('indicationsAndUsage', '')).strip(),
            str(item['label'].get('dosageAndAdministration', '')).strip(),
            str(item['label'].get('mechanismOfAction', '')).strip(),
        ])

        # Prepare metadata
        metadata = {}
        if item.get('setId') is not None:
            metadata["item_id"] = item.get('setId')
            metadata["setId"] = item.get('setId') # TODO: use this over 'item_id'.
            metadata['name'] = item.get('drugName')
            metadata['drugName'] = item.get('drugName') # TODO: use this over 'name'.
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
        chunks_similar = spacy_chunk_text(similar_check_text, max_tokens=MAX_TOKENS, overlap_tokens=30)

        # Add each chunk with the same id and metadata
        for idx, chunk in enumerate(chunks):
            chunk_id = f"{item['setId']}:chunk:{idx}"
            ids.append(chunk_id)
            documents.append(chunk)
            metadatas.append(metadata)

        for idx, chunk in enumerate(chunks_similar):
            chunk_id = f"{item['setId']}:chunk:{idx}"
            ids_similar.append(chunk_id)
            documents_similar.append(chunk)
            metadatas_similar.append(metadata)

        print(f'Upserting {len(ids)} chunks and {len(ids_similar)} similar chunks to ChromaDB')

        # Upsert to ChromaDB
        collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )

        collection_similar.upsert(
            ids=ids_similar,
            documents=documents_similar,
            metadatas=metadatas_similar
        )

        total_chunks += len(ids)
        print(f'Upserted {len(ids)} chunks')
        ids = []
        ids_similar = []
        documents = []
        documents_similar = []
        metadatas = []
        metadatas_similar = []
    
    print(f"Successfully upserted {total_chunks} chunks from {len(q_items)} items to ChromaDB collection: {collection_name}")