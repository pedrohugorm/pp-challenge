# README

## System Design

The application follows a microservices architecture with the following components:

```mermaid
graph TB
    A[Frontend - NextJS] --> B[Backend - NestJS]
    B --> C[ChromaDB]
    B --> D[Redis]
    B --> E[PostgreSQL]
    F[Data Pipeline - Python Scripts] --> C
    F --> E
    
    style A fill:#61dafb,color:#000000
    style B fill:#e0234e
    style C fill:#f7df1e,color:#000000
    style D fill:#dc382d
    style E fill:#336791
    style F fill:#3776ab
```

### Architecture Overview

- **Frontend (NextJS)**: React-based web application providing the user interface
- **Backend (NestJS)**: Node.js API server handling business logic and data processing
- **ChromaDB**: Vector database for similarity search and AI-powered features
- **Redis**: In-memory cache for performance optimization
- **PostgreSQL**: Primary relational database for structured data storage
- **Data Pipeline**: Python scripts for data processing, enrichment, and migration between databases

## Setup Instructions

### Install Spacy en_core_web_sm

```bash
python -m spacy download en_core_web_sm
```
