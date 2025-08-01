# Data Pipeline

This directory contains Python scripts for processing and ingesting drug data into various databases and vector stores.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install Spacy Language Model

After installing the requirements, you need to download the required spacy language model:

```bash
python setup_spacy.py
```

Or manually:

```bash
python -m spacy download en_core_web_sm
```

### 3. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Database connections
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=drugs_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Elasticsearch
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_URL=http://localhost:9200

# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

## Scripts Overview

- **`process_data.py`** - Main pipeline script that orchestrates the entire data processing workflow
- **`upsert_items_to_postgres.py`** - Inserts processed drug data into PostgreSQL
- **`upsert_items_to_elasticsearch.py`** - Inserts processed drug data into Elasticsearch
- **`upsert_to_chromadb.py`** - Inserts processed drug data into ChromaDB for vector search
- **`summarize_description.py`** - Uses OpenAI to summarize drug descriptions
- **`enhance_content.py`** - Enhances drug content using AI
- **`find_similar_drugs_by_name.py`** - Finds similar drugs using vector similarity
- **`rate_limiter.py`** - Rate limiting utilities for API calls

## Requirements.txt Cleanup

The requirements.txt has been cleaned up to include only the necessary dependencies:

### Added Dependencies:
- `psycopg2-binary` - PostgreSQL adapter
- `sentence-transformers` - For text embeddings
- `spacy` - NLP processing
- `numpy` - Numerical computing
- `beautifulsoup4` - HTML parsing

### Removed Unnecessary Dependencies:
- `asyncio` (built-in Python module)
- `pip` (package manager)
- Various transitive dependencies that are automatically installed
- Unused packages like `colorama`, `Pygments`, etc.

## Usage

Run the main processing pipeline:

```bash
python scripts/process_data.py
```

Or run individual scripts as needed:

```bash
python scripts/upsert_items_to_postgres.py
python scripts/upsert_items_to_elasticsearch.py
python scripts/upsert_to_chromadb.py
```