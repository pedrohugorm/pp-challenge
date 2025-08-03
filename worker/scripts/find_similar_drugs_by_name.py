from typing import List, Tuple
from collections import Counter
import numpy as np
import chromadb
import os

from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction


def find_similar_drugs_by_name(
        drug_name: str,
        collection_name: str = "drug_similar_data",
        top_k: int = 5
) -> List[Tuple[str, int]]:
    """
    Find drugs similar to the given drugName using cosine similarity on average embedding.

    Parameters:
        collection_name (str): Name of the Chroma collection.
        drug_name (str): The drug to compare against.
        top_k (int): Number of top similar drugs to return.

    Returns:
        List[Tuple[str, int]]: Ranked list of similar drug names and their match count.
    """
    # Initialize ChromaDB client
    chroma_host = os.getenv("CHROMA_HOST", "localhost")
    chroma_port = os.getenv("CHROMA_PORT", "8000")

    print(f'Starting Chroma DB similar pipeline {chroma_host}:{chroma_port}')

    client = chromadb.HttpClient(
        host=chroma_host,
        port=int(chroma_port),
        ssl=False
    )

    # Set up local embedding model
    embedding_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

    collection = client.get_or_create_collection(
        name=collection_name,
        embedding_function=embedding_fn
    )

    # Step 1: Retrieve all stored documents and select embeddings for the target drug
    all_docs = collection.get(include=["documents", "embeddings", "metadatas"])
    drug_names = set(m.get("name") for m in all_docs["metadatas"])
    print("Available:", drug_names)

    embeddings = [
        np.array(emb)
        for emb, meta in zip(all_docs["embeddings"], all_docs["metadatas"])
        if meta.get("name") == drug_name
    ]

    if not embeddings:
        raise ValueError(f"No embeddings found for drugName: {drug_name}")

    # Step 2: Compute mean embedding for the target drug
    mean_embedding = np.mean(embeddings, axis=0)

    # Step 3: Query the collection using the average embedding
    results = collection.query(
        query_embeddings=[mean_embedding.tolist()],
        n_results=top_k * 3,
        include=["metadatas"]
    )

    # Step 4: Aggregate similar drug names, excluding the original
    similar_metadatas = results["metadatas"][0]
    similar_names = [
        m["name"]
        for m in similar_metadatas
        if m.get("name") and m["name"] != drug_name
    ]
    ranked = Counter(similar_names).most_common(top_k)

    return ranked
