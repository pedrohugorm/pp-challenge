# Temporal Python Worker

This is a Python worker for Temporal workflows. It provides a sample workflow and activity implementation.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy the environment file:
```bash
cp env.example .env
```

3. Update the `.env` file with your Temporal configuration.

## Running Locally

```bash
python worker.py
```

## Running with Docker

The worker is configured to run as part of the Docker Compose setup. It will automatically connect to the Temporal server running in the same network.

## Configuration

- `TEMPORAL_ADDRESS`: Address of the Temporal server (default: temporal:7233)
- `TEMPORAL_NAMESPACE`: Temporal namespace (default: default)
- `TASK_QUEUE`: Task queue name (default: sample-task-queue)

## Sample Workflow

The worker includes a sample workflow that:
1. Takes a name as input
2. Calls a sample activity that returns a greeting
3. Returns the result

## Adding New Workflows

To add new workflows:

1. Create new workflow classes with the `@workflow.defn` decorator
2. Create new activities with the `@activity.defn` decorator
3. Register them in the `main()` function in `worker.py` 