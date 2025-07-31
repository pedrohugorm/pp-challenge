import asyncio
import logging
from temporalio.client import Client
from temporalio.worker import Worker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    """Main function to run the Temporal worker."""
    # Connect to Temporal server
    client = await Client.connect(
        os.getenv("TEMPORAL_ADDRESS", "localhost:7233"),
        namespace=os.getenv("TEMPORAL_NAMESPACE", "default")
    )
    
    # Create and run the worker
    worker = Worker(
        client,
        task_queue=os.getenv("TASK_QUEUE", "main"),
        workflows=[],
        activities=[]
    )
    
    logger.info("Starting Temporal worker...")
    logger.info(f"Connected to Temporal at: {os.getenv('TEMPORAL_ADDRESS', 'localhost:7233')}")
    logger.info(f"Task queue: {os.getenv('TASK_QUEUE', 'main')}")
    
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main()) 