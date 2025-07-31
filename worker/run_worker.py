#!/usr/bin/env python3
"""
Simple runner script for the Temporal worker.
This script ensures the virtual environment is used.
"""

import sys
import os
import subprocess

def main():
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Path to the virtual environment Python
    venv_python = os.path.join(script_dir, "venv", "bin", "python")
    
    # Path to the worker script
    worker_script = os.path.join(script_dir, "worker.py")
    
    # Check if virtual environment exists
    if not os.path.exists(venv_python):
        print("Virtual environment not found. Please run:")
        print("cd worker && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt")
        sys.exit(1)
    
    # Run the worker using the virtual environment
    try:
        subprocess.run([venv_python, worker_script], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error running worker: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nWorker stopped by user.")
        sys.exit(0)

if __name__ == "__main__":
    main() 