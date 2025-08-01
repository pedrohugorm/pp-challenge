#!/usr/bin/env python3

import asyncio
import sys
import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

# Load environment variables from .env file in the parent directory (project root)
load_dotenv('../.env')

# Add the root directory to the path so we can import from activities and services
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)


def query_qdrant(search_text: str, collection_name: str = "drug_data", limit: int = 5):
    """
    Simple vector query to Qdrant.
    
    Args:
        search_text: Text to search for
        collection_name: Name of the Qdrant collection
        limit: Number of results to return
    """
    client = QdrantClient(
        url=os.getenv("QDRANT_URL", "http://localhost:6333"),
        api_key=os.getenv("QDRANT_API_KEY")
    )
    
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    search_vector = embedding_model.encode(search_text).tolist()
    
    results = client.search(
        collection_name=collection_name,
        query_vector=search_vector,
        limit=limit
    )
    
    return results


async def main():
    search_text = "for migraines"
    results = query_qdrant(search_text)
    
    print(f"Search results for: '{search_text}'")
    for result in results:
        print(f"Score: {result.score}, ID: {result.id}")


if __name__ == "__main__":
    asyncio.run(main())
