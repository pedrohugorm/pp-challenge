# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Temporal Python worker designed for processing unstructured drug information. The worker uses OpenAI's GPT models to extract structured pharmaceutical data from raw text/HTML content, applying sophisticated HTML cleaning and data extraction pipelines.

## Architecture

### Core Components

- **Temporal Worker** (`worker.py`): Main entry point that connects to Temporal server and registers activities
- **Drug Information Processing** (`activities/process_unstructured_drug_information.py`): Primary activity that extracts structured drug data using AI
- **Structured Response Service** (`services/structured_response.py`): Handles OpenAI API interactions with rate limiting
- **HTML Processing Pipeline** (`scripts/`): Tools for cleaning and structuring HTML/JSON data

### Data Flow

1. **Input**: Unstructured drug information (text/HTML)
2. **Cleaning**: HTML tags stripped, unicode normalized (`clean_json_html.py`)
3. **Structuring**: HTML parsed into hierarchical JSON (`structure_json_html.py`)
4. **AI Extraction**: OpenAI GPT-4o-mini extracts structured data using Pydantic schemas
5. **Output**: Validated `DrugData` object with pharmaceutical information

### Key Data Models

The `DrugData` schema (`activities/process_unstructured_drug_information.py:19-39`) defines the target structure:
- Drug identification (name, generic, manufacturer)
- Clinical information (indications, contraindications, warnings)
- Dosing details with target groups
- Regulatory codes (NDC, RxNorm, ATC)
- Confidence scoring

## Development Commands

### Setup
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # or `. venv/bin/activate`

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp env.example .env
# Edit .env with your OPENAI_API_KEY and Temporal configuration
```

### Running the Worker
```bash
# Direct execution
python worker.py

# Using runner script (ensures venv is used)
python run_worker.py

# Docker
docker build -t temporal-worker .
docker run --env-file .env temporal-worker
```

### Data Processing Scripts
```bash
# Process drug labels data
python scripts/process_data.py

# Clean HTML from JSON structures
python scripts/clean_json_html.py

# Structure HTML content
python scripts/structure_json_html.py
```

### Testing
```bash
# Run with pytest (included in requirements.txt)
pytest
```

## Environment Configuration

Required environment variables:
- `OPENAI_API_KEY`: OpenAI API key for GPT model access
- `TEMPORAL_ADDRESS`: Temporal server address (default: temporal:7233)
- `TEMPORAL_NAMESPACE`: Temporal namespace (default: default)
- `TASK_QUEUE`: Task queue name (default: main)

## Rate Limiting

The system implements rate limiting for OpenAI API calls:
- GPT-4o: 100 requests/minute
- GPT-4o-mini: 100 requests/minute

Rate limiters are configured in `services/rate_limiter.py`.

## HTML Processing Strategy

The project handles complex pharmaceutical HTML/XML documents through a multi-stage pipeline:

1. **Unicode Normalization**: Strips non-ASCII characters while preserving structure
2. **HTML Cleaning**: Uses BeautifulSoup to remove formatting while preserving semantic content
3. **Structure Preservation**: Converts HTML hierarchy to JSON for better AI processing
4. **Tag Filtering**: Removes script/style elements and unwraps container divs

## AI Extraction Prompt Strategy

The extraction system prompt in `process_unstructured_drug_information.py:70-121` emphasizes:
- Complete information extraction (no omissions)
- Exact text preservation (no modifications)
- Multiple validation passes
- Comprehensive field coverage
- Structured output validation

## File Structure Notes

- `scripts/data/`: Contains sample data files and processing results
- `activities/`: Temporal activities (business logic)
- `services/`: Shared services (OpenAI, rate limiting)
- `venv/`: Local Python virtual environment (not for production)

## Docker Integration

The worker is designed to run in Docker containers with the broader Temporal ecosystem. The Dockerfile builds a slim Python 3.11 image with all dependencies.